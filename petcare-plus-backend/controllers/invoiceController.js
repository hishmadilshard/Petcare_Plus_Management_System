const db = require('../config/db');
const {
  successResponse, errorResponse, paginatedResponse,
} = require('../utils/response');

// ── GET ALL INVOICES ──────────────────────────────────────
const getAllInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where  = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'Owner') {
      where += ' AND po.user_id = ?';
      params.push(req.user.user_id);
    }
    if (status) {
      where += ' AND i.payment_status = ?';
      params.push(status);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total
       FROM invoices i
       JOIN pet_owners po ON i.owner_id = po.owner_id
       JOIN users u       ON po.user_id = u.user_id
       LEFT JOIN appointments a
         ON i.appointment_id = a.appointment_id
       ${where}`,
      params
    );

    const [invoices] = await db.query(
      `SELECT i.*,
         u.full_name AS owner_name,
         u.phone     AS owner_phone,
         a.service_type
       FROM invoices i
       JOIN pet_owners po ON i.owner_id = po.owner_id
       JOIN users u       ON po.user_id = u.user_id
       LEFT JOIN appointments a
         ON i.appointment_id = a.appointment_id
       ${where}
       ORDER BY i.invoice_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return paginatedResponse(
      res, 'Invoices fetched.', invoices,
      {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    return errorResponse(
      res, 'Failed to fetch invoices. ' + error.message, 500
    );
  }
};

// ── GET INVOICE BY ID ─────────────────────────────────────
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoices] = await db.query(
      `SELECT i.*,
         u.full_name AS owner_name,
         u.phone     AS owner_phone,
         a.service_type, a.appointment_date
       FROM invoices i
       JOIN pet_owners po ON i.owner_id = po.owner_id
       JOIN users u       ON po.user_id = u.user_id
       LEFT JOIN appointments a
         ON i.appointment_id = a.appointment_id
       WHERE i.invoice_id = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return errorResponse(res, 'Invoice not found.', 404);
    }

    // Fetch items with inventory details
    const [items] = await db.query(
      `SELECT
         ii.*,
         inv.item_name    AS inventory_name,
         inv.category     AS inventory_category,
         inv.unit         AS inventory_unit,
         inv.strength,
         inv.brand,
         inv.dosage_form
       FROM invoice_items ii
       LEFT JOIN inventory inv
         ON ii.inventory_item_id = inv.item_id
       WHERE ii.invoice_id = ?`,
      [id]
    );

    return successResponse(res, 'Invoice fetched.', {
      ...invoices[0], items,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return errorResponse(res, 'Failed to fetch invoice.', 500);
  }
};

// ── CREATE INVOICE ────────────────────────────────────────
const createInvoice = async (req, res) => {
  try {
    const {
      owner_id, appointment_id,
      tax_rate = 0, discount = 0,
      payment_method = 'Cash',
      notes, due_date, items = [],
    } = req.body;

    if (!owner_id) {
      return errorResponse(res, 'Owner is required.', 400);
    }
    if (!items.length) {
      return errorResponse(
        res, 'At least one item is required.', 400
      );
    }

    const apptId = appointment_id && appointment_id !== ''
      ? parseInt(appointment_id) : null;

    // Validate owner
    const [owner] = await db.query(
      'SELECT owner_id FROM pet_owners WHERE owner_id = ?',
      [owner_id]
    );
    if (owner.length === 0) {
      return errorResponse(res, 'Owner not found.', 404);
    }

    // Validate appointment if provided
    if (apptId) {
      const [appt] = await db.query(
        `SELECT appointment_id FROM appointments
         WHERE appointment_id = ?`,
        [apptId]
      );
      if (appt.length === 0) {
        return errorResponse(res, 'Appointment not found.', 404);
      }
    }

    // ✅ Validate inventory stock for inventory items
    for (const item of items) {
      if (item.inventory_item_id) {
        const [invRows] = await db.query(
          `SELECT item_id, item_name, quantity
           FROM inventory WHERE item_id = ?`,
          [item.inventory_item_id]
        );
        if (invRows.length === 0) {
          return errorResponse(
            res,
            `Inventory item not found: ${item.description}`,
            404
          );
        }
        if (invRows[0].quantity < parseFloat(item.quantity)) {
          return errorResponse(
            res,
            `Insufficient stock for "${invRows[0].item_name}". ` +
            `Available: ${invRows[0].quantity}, ` +
            `Requested: ${item.quantity}`,
            400
          );
        }
      }
    }

    // Calculate totals
    const subtotal  = items.reduce((sum, item) =>
      sum + (parseFloat(item.quantity) *
             parseFloat(item.unit_price)), 0
    );
    const taxAmount = (subtotal * parseFloat(tax_rate)) / 100;
    const total     = subtotal + taxAmount -
                      parseFloat(discount || 0);

    // Generate invoice number
    const now       = new Date();
    const yearMonth = `${now.getFullYear()}${
      String(now.getMonth() + 1).padStart(2, '0')}`;
    const [last]    = await db.query(
      `SELECT invoice_number FROM invoices
       WHERE invoice_number LIKE ?
       ORDER BY invoice_id DESC LIMIT 1`,
      [`INV-${yearMonth}-%`]
    );
    const lastNum   = last.length
      ? parseInt(last[0].invoice_number.split('-')[2]) : 0;
    const invoiceNum = `INV-${yearMonth}-${
      String(lastNum + 1).padStart(4, '0')}`;

    // Insert invoice
    const [result] = await db.query(
      `INSERT INTO invoices
        (owner_id, appointment_id, invoice_number,
         subtotal, tax_rate, tax_amount,
         discount, total_amount,
         payment_method, payment_status,
         notes, due_date, invoice_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, NOW())`,
      [
        parseInt(owner_id),
        apptId,
        invoiceNum,
        subtotal,
        parseFloat(tax_rate),
        taxAmount,
        parseFloat(discount || 0),
        total,
        payment_method,
        notes    || null,
        due_date || null,
      ]
    );

    const invoiceId = result.insertId;

    // Insert items + ✅ deduct inventory stock
    for (const item of items) {
      const invItemId = item.inventory_item_id || null;

      await db.query(
        `INSERT INTO invoice_items
          (invoice_id, inventory_item_id,
           description, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          invItemId,
          item.description,
          parseFloat(item.quantity),
          parseFloat(item.unit_price),
          parseFloat(item.quantity) * parseFloat(item.unit_price),
        ]
      );

      // ✅ Auto-deduct from inventory if linked
      if (invItemId) {
        await db.query(
          `UPDATE inventory
           SET quantity = quantity - ?
           WHERE item_id = ?`,
          [parseFloat(item.quantity), invItemId]
        );

        console.log(
          `📦 Stock deducted: item_id=${invItemId}, ` +
          `qty=${item.quantity}`
        );
      }
    }

    return successResponse(
      res, `✅ Invoice ${invoiceNum} created! Stock updated.`,
      { invoice_id: invoiceId, invoice_number: invoiceNum },
      201
    );

  } catch (error) {
    console.error('Create invoice error:', error);
    return errorResponse(
      res, 'Failed to create invoice. ' + error.message, 500
    );
  }
};

// ── MARK AS PAID ──────────────────────────────────────────
const markAsPaid = async (req, res) => {
  try {
    const { id }                       = req.params;
    const { payment_method = 'Cash' }  = req.body;

    const [existing] = await db.query(
      'SELECT * FROM invoices WHERE invoice_id = ?', [id]
    );
    if (existing.length === 0) {
      return errorResponse(res, 'Invoice not found.', 404);
    }

    await db.query(
      `UPDATE invoices SET
         payment_status = 'Paid',
         payment_method = ?,
         paid_date      = CURDATE()
       WHERE invoice_id = ?`,
      [payment_method, id]
    );

    return successResponse(res, 'Invoice marked as paid! ✅');
  } catch (error) {
    console.error('Mark paid error:', error);
    return errorResponse(
      res, 'Failed to update invoice. ' + error.message, 500
    );
  }
};

// ── DELETE INVOICE ────────────────────────────────────────
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Restore inventory stock when invoice is deleted
    const [items] = await db.query(
      `SELECT inventory_item_id, quantity
       FROM invoice_items
       WHERE invoice_id = ? AND inventory_item_id IS NOT NULL`,
      [id]
    );

    for (const item of items) {
      await db.query(
        `UPDATE inventory
         SET quantity = quantity + ?
         WHERE item_id = ?`,
        [item.quantity, item.inventory_item_id]
      );
    }

    await db.query(
      'DELETE FROM invoice_items WHERE invoice_id = ?', [id]
    );
    await db.query(
      'DELETE FROM invoices WHERE invoice_id = ?', [id]
    );

    return successResponse(
      res, 'Invoice deleted. Stock restored. ✅'
    );
  } catch (error) {
    console.error('Delete invoice error:', error);
    return errorResponse(res, 'Failed to delete invoice.', 500);
  }
};

// ── REVENUE STATS ─────────────────────────────────────────
const getRevenueStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(*) AS total_invoices,
        SUM(CASE WHEN payment_status = 'Paid'
          THEN total_amount ELSE 0 END)   AS total_revenue,
        SUM(CASE WHEN payment_status = 'Pending'
          THEN total_amount ELSE 0 END)   AS pending_revenue,
        SUM(CASE WHEN payment_status = 'Paid'
          AND DATE(paid_date) = CURDATE()
          THEN total_amount ELSE 0 END)   AS today_revenue,
        COUNT(CASE WHEN payment_status = 'Paid'
          THEN 1 END)                     AS paid_invoices,
        COUNT(CASE WHEN payment_status = 'Pending'
          THEN 1 END)                     AS pending_count
      FROM invoices
    `);

    const [monthly] = await db.query(`
      SELECT
        DATE_FORMAT(invoice_date, '%b %Y') AS month,
        SUM(CASE WHEN payment_status = 'Paid'
          THEN total_amount ELSE 0 END) AS revenue,
        COUNT(*) AS total
      FROM invoices
      WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY
        DATE_FORMAT(invoice_date, '%b %Y'),
        YEAR(invoice_date),
        MONTH(invoice_date)
      ORDER BY YEAR(invoice_date), MONTH(invoice_date)
    `);

    return successResponse(res, 'Revenue stats fetched.', {
      ...stats[0],
      monthly_revenue: monthly,
    });
  } catch (error) {
    console.error('Revenue stats error:', error);
    return errorResponse(res, 'Failed to fetch stats.', 500);
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  markAsPaid,
  deleteInvoice,
  getRevenueStats,
};
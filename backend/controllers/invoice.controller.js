const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');
const { generateInvoiceNumber } = require('../utils/encryption');

const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, ownerId, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT i.*, u.full_name as owner_name, u.email as owner_email, u.phone as owner_phone,
        a.appointment_date, a.service_type as appointment_service
      FROM invoices i
      LEFT JOIN pet_owners po ON i.owner_id = po.owner_id
      LEFT JOIN users u ON po.user_id = u.user_id
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND i.payment_status = ?'; params.push(status); }
    if (ownerId) { sql += ' AND i.owner_id = ?'; params.push(ownerId); }
    if (startDate && endDate) { sql += ' AND i.invoice_date BETWEEN ? AND ?'; params.push(startDate, endDate); }
    if (req.user.role === 'Owner') { sql += ' AND po.user_id = ?'; params.push(req.user.id); }

    const countSql = sql.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [invoices] = await db.query(sql, params);

    return success(res, {
      invoices,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Invoices retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve invoices', 500);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT i.*, u.full_name as owner_name, u.email as owner_email, u.phone as owner_phone,
        a.appointment_date, a.service_type as appointment_service
      FROM invoices i
      LEFT JOIN pet_owners po ON i.owner_id = po.owner_id
      LEFT JOIN users u ON po.user_id = u.user_id
      LEFT JOIN appointments a ON i.appointment_id = a.appointment_id
      WHERE i.invoice_id = ?
    `, [id]);
    if (rows.length === 0) return notFound(res, 'Invoice');

    const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
    const invoice = { ...rows[0], items };
    return success(res, { invoice }, 'Invoice retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve invoice', 500);
  }
};

const createInvoice = async (req, res) => {
  try {
    const { owner_id, appointment_id, items, due_date, notes } = req.body;
    const total_amount = req.body.total_amount || (items ? items.reduce((s, i) => s + i.quantity * i.unit_price, 0) : 0);

    const [ownerRows] = await db.query('SELECT owner_id FROM pet_owners WHERE owner_id = ?', [owner_id]);
    if (ownerRows.length === 0) return res.status(404).json({ success: false, message: 'Owner not found' });

    const invoiceNumber = generateInvoiceNumber();

    const [result] = await db.query(
      `INSERT INTO invoices (owner_id, appointment_id, invoice_number, invoice_date, due_date, total_amount, payment_status, notes)
       VALUES (?, ?, ?, NOW(), ?, ?, 'Pending', ?)`,
      [owner_id, appointment_id || null, invoiceNumber, due_date || null, total_amount, notes || null]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    const [rows] = await db.query('SELECT * FROM invoices WHERE invoice_id = ?', [result.insertId]);
    const [invoiceItems] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [result.insertId]);
    return success(res, { invoice: { ...rows[0], items: invoiceItems } }, 'Invoice created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create invoice', 500);
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method, due_date, notes } = req.body;

    const [existing] = await db.query('SELECT invoice_id FROM invoices WHERE invoice_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Invoice');

    const fields = [];
    const params = [];
    if (payment_status !== undefined) { fields.push('payment_status = ?'); params.push(payment_status); }
    if (payment_method !== undefined) { fields.push('payment_method = ?'); params.push(payment_method); }
    if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE invoices SET ${fields.join(', ')} WHERE invoice_id = ?`, params);
    }

    const [rows] = await db.query('SELECT * FROM invoices WHERE invoice_id = ?', [id]);
    return success(res, { invoice: rows[0] }, 'Invoice updated successfully');
  } catch (err) {
    return error(res, 'Failed to update invoice', 500);
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT invoice_id, payment_status FROM invoices WHERE invoice_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Invoice');
    if (existing[0].payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot delete paid invoices.' });
    }
    await db.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    await db.query('DELETE FROM invoices WHERE invoice_id = ?', [id]);
    return success(res, null, 'Invoice deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete invoice', 500);
  }
};

const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    const [existing] = await db.query('SELECT invoice_id, payment_status FROM invoices WHERE invoice_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Invoice');
    if (existing[0].payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already marked as paid' });
    }

    await db.query(
      "UPDATE invoices SET payment_status = 'Paid', payment_method = ?, paid_date = NOW() WHERE invoice_id = ?",
      [payment_method || null, id]
    );

    const [rows] = await db.query('SELECT * FROM invoices WHERE invoice_id = ?', [id]);
    return success(res, { invoice: rows[0] }, 'Invoice marked as Paid');
  } catch (err) {
    return error(res, 'Failed to mark invoice as paid', 500);
  }
};

const getPendingInvoices = async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, u.full_name as owner_name, u.email as owner_email
      FROM invoices i
      LEFT JOIN pet_owners po ON i.owner_id = po.owner_id
      LEFT JOIN users u ON po.user_id = u.user_id
      WHERE i.payment_status = 'Pending'
      ORDER BY i.invoice_date DESC
    `);
    return success(res, { invoices, count: invoices.length }, 'Pending invoices retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve pending invoices', 500);
  }
};

const getInvoiceStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'Pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN payment_status = 'Paid' AND MONTH(paid_date) = MONTH(NOW()) THEN total_amount ELSE 0 END) as revenue_this_month,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_count
      FROM invoices
    `);
    return success(res, rows[0], 'Invoice statistics retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve invoice statistics', 500);
  }
};

module.exports = {
  getAllInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice,
  markAsPaid, getPendingInvoices, getInvoiceStats
};

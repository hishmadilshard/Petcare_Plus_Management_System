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
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { generateInvoiceNumber } = require('../utils/encryption');
const { Op } = require('sequelize');

/**
 * Get all invoices
 * GET /api/invoices
 */
const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, ownerId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.payment_status = status;
    if (ownerId) where.owner_id = ownerId;
    if (startDate && endDate) {
      where.invoice_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // If user is Owner, only show their invoices
    if (req.user.role === 'Owner') {
      const owner = await PetOwner.findOne({ where: { user_id: req.user.id } });
      if (owner) {
        where.owner_id = owner.owner_id;
      }
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'full_name', 'email', 'phone']
            }
          ]
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['appointment_id', 'appointment_date', 'service_type']
        },
        {
          model: InvoiceItem,
          as: 'items'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['invoice_date', 'DESC']]
    });

    return success(res, {
      invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Invoices retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all invoices error', { error: err.message });
    return error(res, 'Failed to retrieve invoices', 500);
  }
};

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 */
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: Appointment,
          as: 'appointment'
        },
        {
          model: InvoiceItem,
          as: 'items'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['full_name']
        }
      ]
    });

    if (!invoice) {
      return notFound(res, 'Invoice');
    }

    securityLogger.logDataAccess(req.user.id, 'Invoice', id, 'READ');

    return success(res, { invoice }, 'Invoice retrieved successfully');

  } catch (err) {
    securityLogger.error('Get invoice by ID error', { error: err.message });
    return error(res, 'Failed to retrieve invoice', 500);
  }
};

/**
 * Create invoice
 * POST /api/invoices
 */
const createInvoice = async (req, res) => {
  try {
    const {
      owner_id,
      appointment_id,
      items, // Array of { description, item_type, quantity, unit_price }
      tax,
      discount,
      payment_method,
      invoice_date,
      due_date,
      notes
    } = req.body;

    // Verify owner exists
    const owner = await PetOwner.findByPk(owner_id);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
        timestamp: new Date().toISOString()
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must contain at least one item',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // Calculate total
    const taxAmount = tax || 0;
    const discountAmount = discount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
      owner_id,
      appointment_id,
      invoice_number: invoiceNumber,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total_amount: totalAmount,
      payment_status: 'Pending',
      payment_method,
      invoice_date: invoice_date || new Date(),
      due_date,
      notes,
      created_by: req.user.id
    });

    // Create invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.invoice_id,
      description: item.description,
      item_type: item.item_type || 'Service',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price
    }));

    await InvoiceItem.bulkCreate(invoiceItems);

    // Reload with associations
    const createdInvoice = await Invoice.findByPk(invoice.invoice_id, {
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: InvoiceItem,
          as: 'items'
        }
      ]
    });

    securityLogger.info('Invoice created', {
      createdBy: req.user.id,
      invoiceId: invoice.invoice_id,
      invoiceNumber,
      totalAmount
    });

    return success(res, { invoice: createdInvoice }, 'Invoice created successfully', 201);

  } catch (err) {
    securityLogger.error('Create invoice error', { error: err.message });
    return error(res, 'Failed to create invoice', 500);
  }
};

/**
 * Update invoice
 * PUT /api/invoices/:id
 */
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_status,
      payment_method,
      paid_amount,
      paid_date,
      due_date,
      notes
    } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return notFound(res, 'Invoice');
    }

    // Update invoice
    await Invoice.update(
      {
        payment_status,
        payment_method,
        paid_amount,
        paid_date,
        due_date,
        notes
      },
      { where: { invoice_id: id } }
    );

    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        { model: PetOwner, as: 'owner', include: [{ model: User, as: 'user' }] },
        { model: InvoiceItem, as: 'items' }
      ]
    });

    securityLogger.info('Invoice updated', {
      updatedBy: req.user.id,
      invoiceId: id,
      newStatus: payment_status
    });

    return success(res, { invoice: updatedInvoice }, 'Invoice updated successfully');

  } catch (err) {
    securityLogger.error('Update invoice error', { error: err.message });
    return error(res, 'Failed to update invoice', 500);
  }
};

/**
 * Delete invoice
 * DELETE /api/invoices/:id
 */
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return notFound(res, 'Invoice');
    }

    // Prevent deleting paid invoices
    if (invoice.payment_status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid invoices. Please cancel instead.',
        timestamp: new Date().toISOString()
      });
    }

    // Delete invoice (cascade will delete items)
    await Invoice.destroy({ where: { invoice_id: id } });

    securityLogger.warn('Invoice deleted', {
      deletedBy: req.user.id,
      invoiceId: id,
      invoiceNumber: invoice.invoice_number
    });

    return success(res, null, 'Invoice deleted successfully');

  } catch (err) {
    securityLogger.error('Delete invoice error', { error: err.message });
    return error(res, 'Failed to delete invoice', 500);
  }
};

/**
 * Mark invoice as paid
 * PUT /api/invoices/:id/pay
 */
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, paid_amount } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return notFound(res, 'Invoice');
    }

    if (invoice.payment_status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already marked as paid',
        timestamp: new Date().toISOString()
      });
    }

    const amountPaid = paid_amount || invoice.total_amount;
    const newStatus = amountPaid >= invoice.total_amount ? 'Paid' : 'Partially Paid';

    await Invoice.update(
      {
        payment_status: newStatus,
        payment_method,
        paid_amount: amountPaid,
        paid_date: new Date()
      },
      { where: { invoice_id: id } }
    );

    const updatedInvoice = await Invoice.findByPk(id);

    securityLogger.info('Invoice marked as paid', {
      markedBy: req.user.id,
      invoiceId: id,
      amountPaid,
      paymentMethod: payment_method
    });

    return success(res, { invoice: updatedInvoice }, `Invoice marked as ${newStatus}`);

  } catch (err) {
    securityLogger.error('Mark invoice as paid error', { error: err.message });
    return error(res, 'Failed to mark invoice as paid', 500);
  }
};

/**
 * Get pending invoices
 * GET /api/invoices/pending
 */
const getPendingInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: {
        payment_status: { [Op.in]: ['Pending', 'Partially Paid'] }
      },
      include: [
        {
          model: PetOwner,
          as: 'owner',
          include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
        }
      ],
      order: [['invoice_date', 'DESC']]
    });

    const totalPending = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount - inv.paid_amount), 0);

    return success(res, {
      invoices,
      count: invoices.length,
      totalPending
    }, 'Pending invoices retrieved');

  } catch (err) {
    securityLogger.error('Get pending invoices error', { error: err.message });
    return error(res, 'Failed to retrieve pending invoices', 500);
  }
};

/**
 * Get invoice statistics
 * GET /api/invoices/stats
 */
const getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices = await Invoice.count();
    const paidInvoices = await Invoice.count({ where: { payment_status: 'Paid' } });
    const pendingInvoices = await Invoice.count({ where: { payment_status: 'Pending' } });

    const totalRevenue = await Invoice.sum('paid_amount', {
      where: { payment_status: { [Op.in]: ['Paid', 'Partially Paid'] } }
    });

    const pendingAmount = await Invoice.sum('total_amount', {
      where: { payment_status: 'Pending' }
    });

    return success(res, {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue || 0,
      pendingAmount: pendingAmount || 0
    }, 'Invoice statistics retrieved');

  } catch (err) {
    securityLogger.error('Get invoice stats error', { error: err.message });
    return error(res, 'Failed to retrieve invoice statistics', 500);
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  getPendingInvoices,
  getInvoiceStats
};
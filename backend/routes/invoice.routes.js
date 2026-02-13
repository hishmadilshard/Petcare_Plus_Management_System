const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { staffOnly } = require('../middleware/verifyRole');
const {
  validateInvoice,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, invoiceController.getAllInvoices);

/**
 * @route   GET /api/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private (Staff only)
 */
router.get('/stats', authenticateToken, staffOnly, invoiceController.getInvoiceStats);

/**
 * @route   GET /api/invoices/pending
 * @desc    Get pending invoices
 * @access  Private (Staff only)
 */
router.get('/pending', authenticateToken, staffOnly, invoiceController.getPendingInvoices);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, invoiceController.getInvoiceById);

/**
 * @route   POST /api/invoices
 * @desc    Create invoice
 * @access  Private (Staff only)
 */
router.post('/', authenticateToken, staffOnly, validateInvoice, invoiceController.createInvoice);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update invoice
 * @access  Private (Staff only)
 */
router.put('/:id', authenticateToken, staffOnly, validateIdParam, invoiceController.updateInvoice);

/**
 * @route   PUT /api/invoices/:id/pay
 * @desc    Mark invoice as paid
 * @access  Private (Staff only)
 */
router.put('/:id/pay', authenticateToken, staffOnly, validateIdParam, invoiceController.markAsPaid);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private (Staff only)
 */
router.delete('/:id', authenticateToken, staffOnly, validateIdParam, invoiceController.deleteInvoice);

module.exports = router;
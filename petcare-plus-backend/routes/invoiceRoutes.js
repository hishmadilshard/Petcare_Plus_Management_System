const express = require('express');
const router = express.Router();
const {
  getAllInvoices, getInvoiceById, createInvoice,
  markAsPaid, deleteInvoice, getRevenueStats,
} = require('../controllers/invoiceController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/revenue-stats', verifyToken, authorizeRoles('Admin', 'Receptionist'), getRevenueStats);
router.get('/', verifyToken, getAllInvoices);
router.get('/:id', verifyToken, getInvoiceById);
router.post('/', verifyToken, authorizeRoles('Admin', 'Receptionist'), createInvoice);
router.patch('/:id/mark-paid', verifyToken, authorizeRoles('Admin', 'Receptionist'), markAsPaid);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteInvoice);
router.put('/:id/pay', verifyToken, markAsPaid);

module.exports = router;
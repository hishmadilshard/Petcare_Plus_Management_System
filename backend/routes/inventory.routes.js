const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { staffOnly, adminOnly } = require('../middleware/verifyRole');
const {
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items
 * @access  Private (Staff only)
 */
router.get('/', authenticateToken, staffOnly, validatePagination, inventoryController.getAllInventoryItems);

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory statistics
 * @access  Private (Staff only)
 */
router.get('/stats', authenticateToken, staffOnly, inventoryController.getInventoryStats);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock items
 * @access  Private (Staff only)
 */
router.get('/low-stock', authenticateToken, staffOnly, inventoryController.getLowStockItems);

/**
 * @route   GET /api/inventory/expired
 * @desc    Get expired items
 * @access  Private (Staff only)
 */
router.get('/expired', authenticateToken, staffOnly, inventoryController.getExpiredItems);

/**
 * @route   GET /api/inventory/expiring-soon
 * @desc    Get items expiring soon
 * @access  Private (Staff only)
 */
router.get('/expiring-soon', authenticateToken, staffOnly, inventoryController.getExpiringItems);

/**
 * @route   GET /api/inventory/category/:category
 * @desc    Get inventory by category
 * @access  Private (Staff only)
 */
router.get('/category/:category', authenticateToken, staffOnly, inventoryController.getInventoryByCategory);

/**
 * @route   GET /api/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Private (Staff only)
 */
router.get('/:id', authenticateToken, staffOnly, validateIdParam, inventoryController.getInventoryItemById);

/**
 * @route   POST /api/inventory
 * @desc    Create inventory item
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, adminOnly, inventoryController.createInventoryItem);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, adminOnly, validateIdParam, inventoryController.updateInventoryItem);

/**
 * @route   PUT /api/inventory/:id/adjust
 * @desc    Adjust inventory quantity
 * @access  Private (Staff only)
 */
router.put('/:id/adjust', authenticateToken, staffOnly, validateIdParam, inventoryController.adjustInventoryQuantity);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory item
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, adminOnly, validateIdParam, inventoryController.deleteInventoryItem);

module.exports = router;
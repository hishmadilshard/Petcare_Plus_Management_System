const express = require('express');
const router = express.Router();
const {
  getAllInventory, getLowStockAlerts, getInventoryById,
  createInventoryItem, updateInventoryItem,
  restockItem, deleteInventoryItem, getInventoryStats,
} = require('../controllers/inventoryController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/stats', verifyToken, getInventoryStats);
router.get('/low-stock', verifyToken, getLowStockAlerts);
router.get('/', verifyToken, getAllInventory);
router.get('/:id', verifyToken, getInventoryById);
router.post('/', verifyToken, authorizeRoles('Admin', 'Receptionist'), createInventoryItem);
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Receptionist'), updateInventoryItem);
router.patch('/:id/restock', verifyToken, authorizeRoles('Admin', 'Receptionist'), restockItem);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteInventoryItem);

module.exports = router;
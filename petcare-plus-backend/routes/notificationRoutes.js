const express = require('express');
const router = express.Router();
const {
  getMyNotifications, markAsRead,
  markAllAsRead, sendNotification, deleteNotification,
} = require('../controllers/notificationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);
router.post('/send', verifyToken, authorizeRoles('Admin'), sendNotification);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;
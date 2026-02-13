const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { staffOnly } = require('../middleware/verifyRole');
const {
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/notifications
 * @desc    Get my notifications
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, notificationController.getMyNotifications);

/**
 * @route   GET /api/notifications/all
 * @desc    Get all notifications (Admin/Staff)
 * @access  Private (Staff only)
 */
router.get('/all', authenticateToken, staffOnly, validatePagination, notificationController.getAllNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, notificationController.getNotificationById);

/**
 * @route   POST /api/notifications
 * @desc    Create notification
 * @access  Private (Staff only)
 */
router.post('/', authenticateToken, staffOnly, notificationController.createNotification);

/**
 * @route   POST /api/notifications/bulk
 * @desc    Send bulk notifications
 * @access  Private (Staff only)
 */
router.post('/bulk', authenticateToken, staffOnly, notificationController.sendBulkNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticateToken, validateIdParam, notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticateToken, validateIdParam, notificationController.deleteNotification);

module.exports = router;
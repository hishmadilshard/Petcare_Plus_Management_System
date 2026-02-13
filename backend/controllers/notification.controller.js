const { Notification, User } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { sendEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

/**
 * Get all notifications for authenticated user
 * GET /api/notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const where = { user_id: userId };
    if (isRead !== undefined) where.is_read = isRead === 'true';
    if (type) where.notification_type = type;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sent_date', 'DESC']]
    });

    return success(res, {
      notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Notifications retrieved successfully');

  } catch (err) {
    securityLogger.error('Get my notifications error', { error: err.message });
    return error(res, 'Failed to retrieve notifications', 500);
  }
};

/**
 * Get all notifications (Admin/Staff only)
 * GET /api/notifications/all
 */
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, type, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (userId) where.user_id = userId;
    if (type) where.notification_type = type;
    if (status) where.status = status;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sent_date', 'DESC']]
    });

    return success(res, {
      notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'All notifications retrieved');

  } catch (err) {
    securityLogger.error('Get all notifications error', { error: err.message });
    return error(res, 'Failed to retrieve notifications', 500);
  }
};

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name', 'email']
        }
      ]
    });

    if (!notification) {
      return notFound(res, 'Notification');
    }

    // Only owner or admin can view
    if (req.user.role !== 'Admin' && notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    return success(res, { notification }, 'Notification retrieved successfully');

  } catch (err) {
    securityLogger.error('Get notification by ID error', { error: err.message });
    return error(res, 'Failed to retrieve notification', 500);
  }
};

/**
 * Create notification
 * POST /api/notifications
 */
const createNotification = async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      notification_type,
      delivery_method,
      priority
    } = req.body;

    // Verify user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Create notification
    const notification = await Notification.create({
      user_id,
      title,
      message,
      notification_type: notification_type || 'General',
      delivery_method: delivery_method || 'App',
      priority: priority || 'Medium',
      status: 'Pending'
    });

    // Send via email if requested
    if (delivery_method === 'Email' || delivery_method === 'All') {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>${title}</h2>
              <p>${message}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from PetCare Plus Management System.
              </p>
            </div>
          `
        });

        await Notification.update(
          { status: 'Sent' },
          { where: { notification_id: notification.notification_id } }
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        await Notification.update(
          { status: 'Failed' },
          { where: { notification_id: notification.notification_id } }
        );
      }
    } else {
      // Mark as sent for in-app only
      await Notification.update(
        { status: 'Sent' },
        { where: { notification_id: notification.notification_id } }
      );
    }

    securityLogger.info('Notification created', {
      createdBy: req.user.id,
      notificationId: notification.notification_id,
      userId: user_id,
      type: notification_type
    });

    return success(res, { notification }, 'Notification created successfully', 201);

  } catch (err) {
    securityLogger.error('Create notification error', { error: err.message });
    return error(res, 'Failed to create notification', 500);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return notFound(res, 'Notification');
    }

    // Only owner can mark as read
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    if (notification.is_read) {
      return res.status(400).json({
        success: false,
        message: 'Notification already marked as read',
        timestamp: new Date().toISOString()
      });
    }

    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { notification_id: id } }
    );

    return success(res, null, 'Notification marked as read');

  } catch (err) {
    securityLogger.error('Mark notification as read error', { error: err.message });
    return error(res, 'Failed to mark notification as read', 500);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return success(res, { updatedCount: result[0] }, 'All notifications marked as read');

  } catch (err) {
    securityLogger.error('Mark all as read error', { error: err.message });
    return error(res, 'Failed to mark all notifications as read', 500);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return notFound(res, 'Notification');
    }

    // Only owner or admin can delete
    if (req.user.role !== 'Admin' && notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    await Notification.destroy({ where: { notification_id: id } });

    securityLogger.info('Notification deleted', {
      deletedBy: req.user.id,
      notificationId: id
    });

    return success(res, null, 'Notification deleted successfully');

  } catch (err) {
    securityLogger.error('Delete notification error', { error: err.message });
    return error(res, 'Failed to delete notification', 500);
  }
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    return success(res, { unreadCount: count }, 'Unread count retrieved');

  } catch (err) {
    securityLogger.error('Get unread count error', { error: err.message });
    return error(res, 'Failed to retrieve unread count', 500);
  }
};

/**
 * Send bulk notifications
 * POST /api/notifications/bulk
 */
const sendBulkNotifications = async (req, res) => {
  try {
    const { user_ids, title, message, notification_type, delivery_method } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
        timestamp: new Date().toISOString()
      });
    }

    const notifications = user_ids.map(userId => ({
      user_id: userId,
      title,
      message,
      notification_type: notification_type || 'General',
      delivery_method: delivery_method || 'App',
      priority: 'Medium',
      status: 'Sent'
    }));

    const created = await Notification.bulkCreate(notifications);

    securityLogger.info('Bulk notifications sent', {
      sentBy: req.user.id,
      count: user_ids.length,
      type: notification_type
    });

    return success(res, { count: created.length }, `${created.length} notifications sent successfully`);

  } catch (err) {
    securityLogger.error('Send bulk notifications error', { error: err.message });
    return error(res, 'Failed to send bulk notifications', 500);
  }
};

module.exports = {
  getMyNotifications,
  getAllNotifications,
  getNotificationById,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendBulkNotifications
};
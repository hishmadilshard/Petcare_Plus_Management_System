const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// ── GET MY NOTIFICATIONS ──────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [notifications] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY sent_date DESC
       LIMIT 50`,
      [userId]
    );

    const [unreadCount] = await db.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    return successResponse(res, 'Notifications fetched.', {
      notifications,
      unread_count: unreadCount[0].count,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(res, 'Failed to fetch notifications.', 500);
  }
};

// ── MARK AS READ ──────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    await db.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE notification_id = ? AND user_id = ?`,
      [id, userId]
    );

    return successResponse(res, 'Notification marked as read.');
  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse(res, 'Failed to mark notification.', 500);
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );

    return successResponse(res, 'All notifications marked as read.');
  } catch (error) {
    console.error('Mark all as read error:', error);
    return errorResponse(res, 'Failed to update notifications.', 500);
  }
};

// ── SEND NOTIFICATION (Admin only) ───────────────────────
const sendNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, notification_channel } = req.body;

    await db.query(
      `INSERT INTO notifications
        (user_id, title, message, type, notification_channel, status)
       VALUES (?, ?, ?, ?, ?, 'Sent')`,
      [user_id, title, message, type || 'General', notification_channel || 'App']
    );

    return successResponse(res, 'Notification sent successfully.', null, 201);
  } catch (error) {
    console.error('Send notification error:', error);
    return errorResponse(res, 'Failed to send notification.', 500);
  }
};

// ── DELETE NOTIFICATION ───────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    await db.query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [id, userId]
    );

    return successResponse(res, 'Notification deleted.');
  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(res, 'Failed to delete notification.', 500);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
};
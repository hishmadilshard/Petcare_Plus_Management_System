const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_date DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    );
    const [countRows] = await db.query('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [req.user.id]);

    return success(res, {
      notifications,
      pagination: { total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) }
    }, 'Notifications retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve notifications', 500);
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications] = await db.query(`
      SELECT n.*, u.full_name as user_name, u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.user_id
      ORDER BY n.sent_date DESC LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);
    const [countRows] = await db.query('SELECT COUNT(*) as total FROM notifications');

    return success(res, {
      notifications,
      pagination: { total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) }
    }, 'All notifications retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve notifications', 500);
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM notifications WHERE notification_id = ?', [id]);
    if (rows.length === 0) return notFound(res, 'Notification');
    return success(res, { notification: rows[0] }, 'Notification retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve notification', 500);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return success(res, { count: rows[0].count }, 'Unread count retrieved');
  } catch (err) {
    return error(res, 'Failed to get unread count', 500);
  }
};

const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, notification_type } = req.body;

    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, notification_type, is_read, sent_date) VALUES (?, ?, ?, ?, 0, NOW())',
      [user_id, title, message, notification_type || 'General']
    );

    const [rows] = await db.query('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);
    return success(res, { notification: rows[0] }, 'Notification created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create notification', 500);
  }
};

const sendBulkNotifications = async (req, res) => {
  try {
    const { user_ids, title, message, notification_type } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'user_ids array is required' });
    }

    let sentCount = 0;
    for (const userId of user_ids) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, notification_type, is_read, sent_date) VALUES (?, ?, ?, ?, 0, NOW())',
        [userId, title, message, notification_type || 'General']
      );
      sentCount++;
    }

    return success(res, { sentCount }, `${sentCount} notifications sent successfully`);
  } catch (err) {
    return error(res, 'Failed to send bulk notifications', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT notification_id FROM notifications WHERE notification_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Notification');
    await db.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [id]);
    return success(res, null, 'Notification marked as read');
  } catch (err) {
    return error(res, 'Failed to mark notification as read', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    return error(res, 'Failed to mark all notifications as read', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT notification_id FROM notifications WHERE notification_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'Notification');
    await db.query('DELETE FROM notifications WHERE notification_id = ?', [id]);
    return success(res, null, 'Notification deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete notification', 500);
  }
};

module.exports = {
  getMyNotifications, getAllNotifications, getNotificationById, getUnreadCount,
  createNotification, sendBulkNotifications, markAsRead, markAllAsRead, deleteNotification
};

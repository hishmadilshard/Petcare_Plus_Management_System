const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { success, error, notFound } = require('../utils/responseHandler');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT user_id, full_name, email, phone, role, status, profile_image, created_at, last_login FROM users WHERE 1=1';
    const params = [];

    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countSql = sql.replace('SELECT user_id, full_name, email, phone, role, status, profile_image, created_at, last_login', 'SELECT COUNT(*) as total');
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await db.query(sql, params);
    return success(res, {
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    }, 'Users retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, role, status, profile_image, created_at, last_login FROM users WHERE user_id = ?',
      [id]
    );
    if (rows.length === 0) return notFound(res, 'User');
    return success(res, { user: rows[0] }, 'User retrieved successfully');
  } catch (err) {
    return error(res, 'Failed to retrieve user', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, status = 'Active' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required' });
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, phone || null, password_hash, role || 'Receptionist', status]
    );

    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, role, status FROM users WHERE user_id = ?',
      [result.insertId]
    );
    return success(res, { user: rows[0] }, 'User created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, role, status } = req.body;

    const [existing] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'User');

    const fields = [];
    const params = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); params.push(full_name); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (role !== undefined) { fields.push('role = ?'); params.push(role); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, params);
    }

    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, role, status FROM users WHERE user_id = ?',
      [id]
    );
    return success(res, { user: rows[0] }, 'User updated successfully');
  } catch (err) {
    return error(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'User');
    await db.query("UPDATE users SET status = 'Inactive' WHERE user_id = ?", [id]);
    return success(res, null, 'User deactivated successfully');
  } catch (err) {
    return error(res, 'Failed to delete user', 500);
  }
};

const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [existing] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [id]);
    if (existing.length === 0) return notFound(res, 'User');
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, id]);
    return success(res, null, 'User status updated successfully');
  } catch (err) {
    return error(res, 'Failed to update user status', 500);
  }
};

const getUserStatistics = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'Vet' THEN 1 ELSE 0 END) as vet_count,
        SUM(CASE WHEN role = 'Receptionist' THEN 1 ELSE 0 END) as receptionist_count,
        SUM(CASE WHEN role = 'Owner' THEN 1 ELSE 0 END) as owner_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
      FROM users
    `);
    return success(res, rows[0], 'User statistics retrieved');
  } catch (err) {
    return error(res, 'Failed to retrieve user statistics', 500);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, changeUserStatus, getUserStatistics };

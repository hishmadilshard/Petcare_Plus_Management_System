const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this-in-production';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { id: user.user_id, user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await db.query('UPDATE users SET refresh_token = ?, last_login = NOW() WHERE user_id = ?', [refreshToken, user.user_id]);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
        token: accessToken,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, role = 'Owner' } = req.body;

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
      [full_name, email, phone || null, password_hash, role, 'Active']
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user_id: result.insertId, email, role }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const [users] = await db.query(
      'SELECT * FROM users WHERE user_id = ? AND refresh_token = ?',
      [decoded.user_id, refreshToken]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = users[0];
    const accessToken = jwt.sign(
      { id: user.user_id, user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ success: true, message: 'Token refreshed', data: { accessToken } });

  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = ?', [refreshToken]);
    }
    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, full_name, email, phone, role, status, profile_image, created_at, last_login FROM users WHERE user_id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: { user: users[0] } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    await db.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?',
      [full_name, phone, req.user.id]
    );
    const [users] = await db.query(
      'SELECT user_id, full_name, email, phone, role, status FROM users WHERE user_id = ?',
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Profile updated', data: { user: users[0] } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, req.user.id]);

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, register, refreshToken: refreshAccessToken, refreshAccessToken, logout, getCurrentUser, updateProfile, changePassword };
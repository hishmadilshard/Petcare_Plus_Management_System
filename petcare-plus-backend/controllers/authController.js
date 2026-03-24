const db        = require('../config/db');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const {
  successResponse, errorResponse,
} = require('../utils/response');

// ── LOGIN ─────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(
        res, 'Email and password are required.', 400
      );
    }

    // ✅ Fetch user with branch info
    const [users] = await db.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.phone,
         u.password_hash, u.role, u.branch_role,
         u.profile_image, u.is_verified,
         u.status, u.last_login,
         u.branch_id,
         b.branch_name, b.city AS branch_city
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return errorResponse(
        res, 'Invalid email or password.', 401
      );
    }

    const user = users[0];

    if (user.status !== 'Active') {
      return errorResponse(
        res,
        'Your account is inactive. Please contact admin.',
        401
      );
    }

    const isMatch = await bcrypt.compare(
      password, user.password_hash
    );
    if (!isMatch) {
      return errorResponse(
        res, 'Invalid email or password.', 401
      );
    }

    await db.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // ✅ Include branch info in JWT
    const token = jwt.sign(
      {
        user_id:     user.user_id,
        email:       user.email,
        role:        user.role,
        branch_role: user.branch_role,
        branch_id:   user.branch_id,
      },
      process.env.JWT_SECRET || 'petcare_secret_2025',
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeUser } = user;

    return successResponse(
      res,
      `Welcome back, ${user.full_name}! 👋`,
      { token, user: safeUser }
    );

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      res, 'Login failed. ' + error.message, 500
    );
  }
};

// ── REGISTER ──────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      full_name, email, password,
      phone, role = 'Owner',
      branch_id, branch_role,
    } = req.body;

    if (!full_name || !email || !password) {
      return errorResponse(
        res,
        'Full name, email and password are required.',
        400
      );
    }

    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return errorResponse(
        res, 'Email already registered.', 409
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
        (full_name, email, phone, password_hash,
         role, branch_role, branch_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        full_name,
        email,
        phone        || null,
        password_hash,
        role,
        branch_role  || null,
        branch_id    || null,
      ]
    );

    return successResponse(
      res, 'Registration successful! 🎉',
      { user_id: result.insertId }, 201
    );

  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(
      res, 'Registration failed. ' + error.message, 500
    );
  }
};

// ── GET PROFILE ───────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.phone,
         u.role, u.branch_role, u.profile_image,
         u.is_verified, u.status, u.last_login,
         u.created_at, u.branch_id,
         b.branch_name, b.city AS branch_city
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'Profile fetched.', users[0]);

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Failed to fetch profile.', 500);
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, profile_image } = req.body;

    await db.query(
      `UPDATE users SET
         full_name     = COALESCE(?, full_name),
         phone         = COALESCE(?, phone),
         profile_image = COALESCE(?, profile_image)
       WHERE user_id = ?`,
      [full_name, phone, profile_image, req.user.user_id]
    );

    const [updated] = await db.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.phone,
         u.role, u.branch_role, u.profile_image,
         u.status, u.branch_id,
         b.branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    return successResponse(
      res, 'Profile updated! ✅', updated[0]
    );

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(
      res, 'Failed to update profile.', 500
    );
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return errorResponse(
        res,
        'Current and new password are required.',
        400
      );
    }

    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    const isMatch = await bcrypt.compare(
      current_password, users[0].password_hash
    );
    if (!isMatch) {
      return errorResponse(
        res, 'Current password is incorrect.', 401
      );
    }

    const newHash = await bcrypt.hash(new_password, 10);

    await db.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newHash, req.user.user_id]
    );

    return successResponse(
      res, 'Password changed successfully! 🔑'
    );

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(
      res, 'Failed to change password.', 500
    );
  }
};

// ── GET ALL STAFF ─────────────────────────────────────────
const getStaff = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Branch admins only see staff in their branch
    // Super Admin sees all staff
    let query = `
      SELECT
        u.user_id, u.full_name, u.email,
        u.role, u.branch_role, u.status,
        u.branch_id, b.branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.branch_id
      WHERE u.role IN ('Admin','Vet','Receptionist')
        AND u.status = 'Active'
    `;
    const params = [];

    // Branch Admin/Manager only sees their own branch staff
    if (
      user.branch_id &&
      user.role !== 'Admin' ||
      user.branch_role === 'Branch_Manager'
    ) {
      query += ' AND u.branch_id = ?';
      params.push(user.branch_id);
    }

    query += ' ORDER BY u.role, u.full_name';

    const [staff] = await db.query(query, params);
    return successResponse(res, 'Staff fetched.', staff);

  } catch (error) {
    console.error('Get staff error:', error);
    return errorResponse(res, 'Failed to fetch staff.', 500);
  }
};

// ── GET ALL VETS ──────────────────────────────────────────
const getVets = async (req, res) => {
  try {
    // ✅ Vets are shared across branches
    // (a vet can work at multiple branches)
    const [vets] = await db.query(
      `SELECT
         u.user_id, u.full_name, u.email,
         u.role, u.branch_id,
         b.branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.branch_id
       WHERE u.role IN ('Admin','Vet')
         AND u.status = 'Active'
       ORDER BY u.full_name`
    );
    return successResponse(res, 'Vets fetched.', vets);

  } catch (error) {
    console.error('Get vets error:', error);
    return errorResponse(res, 'Failed to fetch vets.', 500);
  }
};

// ── CREATE STAFF (Admin only) ─────────────────────────────
const createStaff = async (req, res) => {
  try {
    const {
      full_name, email, password,
      phone, role, branch_id, branch_role,
    } = req.body;

    if (!full_name || !email || !password || !role) {
      return errorResponse(
        res,
        'Full name, email, password and role are required.',
        400
      );
    }

    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return errorResponse(
        res, 'Email already registered.', 409
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    // ✅ Branch Manager can only create staff in their branch
    const assignedBranch = req.user.branch_role === 'Branch_Manager'
      ? req.user.branch_id
      : (branch_id || null);

    const [result] = await db.query(
      `INSERT INTO users
        (full_name, email, phone, password_hash,
         role, branch_role, branch_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        full_name,
        email,
        phone         || null,
        password_hash,
        role,
        branch_role   || role,
        assignedBranch,
      ]
    );

    return successResponse(
      res,
      `✅ Staff member ${full_name} created!`,
      { user_id: result.insertId },
      201
    );

  } catch (error) {
    console.error('Create staff error:', error);
    return errorResponse(
      res, 'Failed to create staff. ' + error.message, 500
    );
  }
};

// ── UPDATE STAFF ──────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name, phone, role,
      branch_role, branch_id, status,
    } = req.body;

    await db.query(
      `UPDATE users SET
         full_name   = COALESCE(?, full_name),
         phone       = COALESCE(?, phone),
         role        = COALESCE(?, role),
         branch_role = COALESCE(?, branch_role),
         branch_id   = COALESCE(?, branch_id),
         status      = COALESCE(?, status)
       WHERE user_id = ?`,
      [
        full_name, phone, role,
        branch_role, branch_id, status, id,
      ]
    );

    return successResponse(res, 'Staff updated! ✅');

  } catch (error) {
    console.error('Update staff error:', error);
    return errorResponse(
      res, 'Failed to update staff.', 500
    );
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  getStaff,
  getVets,
  createStaff,
  updateStaff,
};
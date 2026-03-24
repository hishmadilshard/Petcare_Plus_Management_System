const jwt = require('jsonwebtoken');
const db  = require('../config/db');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Safe query — works even if branches table doesn't exist yet
    let users;
    try {
      const [rows] = await db.query(
        `SELECT u.*, b.branch_name
         FROM users u
         LEFT JOIN branches b ON u.branch_id = b.branch_id
         WHERE u.user_id = ?`,
        [decoded.user_id]
      );
      users = rows;
    } catch (joinErr) {
      // Fallback if branches table doesn't exist yet
      const [rows] = await db.query(
        `SELECT * FROM users WHERE user_id = ?`,
        [decoded.user_id]
      );
      users = rows;
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

const isOwnerOrStaff = (req, res, next) => {
  const staffRoles = ['Admin', 'Vet', 'Receptionist'];
  if (staffRoles.includes(req.user.role)) return next();
  if (req.user.role === 'Owner') return next();
  return res.status(403).json({
    success: false,
    message: 'Access denied.',
  });
};

module.exports = { verifyToken, authorizeRoles, isOwnerOrStaff };
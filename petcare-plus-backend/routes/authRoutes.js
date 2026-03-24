const express = require('express');
const router  = express.Router();
const {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  getStaff,
  getVets,
} = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// ── Public Routes ─────────────────────────────────────────
router.post('/login',    login);
router.post('/register', register);

// ── Forgot / Reset Password ───────────────────────────────
const otpStore = {};

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const db = require('../config/db');

    const [users] = await db.query(
      `SELECT user_id, full_name
       FROM users
       WHERE email = ? AND status = 'Active'`,
      [email]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: 'No active account found with this email.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Log OTP to terminal (in production send via email)
    console.log(`\n🔑 ==========================================`);
    console.log(`   OTP for ${email}: ${otp}`);
    console.log(`🔑 ==========================================\n`);

    return res.json({
      success: true,
      message: 'OTP generated successfully.',
      data: { otp }, // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request. ' + error.message,
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    const db      = require('../config/db');
    const bcrypt  = require('bcryptjs');

    if (!email || !otp || !new_password) {
      return res.json({
        success: false,
        message: 'Email, OTP and new password are required.',
      });
    }

    // Verify OTP
    const stored = otpStore[email];
    if (!stored) {
      return res.json({
        success: false,
        message: 'No OTP requested for this email.',
      });
    }
    if (stored.otp !== otp) {
      return res.json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }
    if (Date.now() > stored.expires) {
      delete otpStore[email];
      return res.json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [password_hash, email]
    );

    // Clear OTP
    delete otpStore[email];

    console.log(`✅ Password reset successful for ${email}`);

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now login. 🎉',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. ' + error.message,
    });
  }
});

// ── Protected Routes ──────────────────────────────────────
router.get('/profile',          verifyToken, getProfile);
router.put('/profile',          verifyToken, updateProfile);
router.put('/change-password',  verifyToken, changePassword);
router.get('/staff',            verifyToken, authorizeRoles('Admin'), getStaff);
router.get('/vets',             verifyToken, getVets);

module.exports = router;
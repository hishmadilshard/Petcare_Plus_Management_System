const { User, RefreshToken } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { verifyPassword } = require('../utils/encryption');
const { securityLogger } = require('../utils/logger');

// =====================================================
// LOGIN
// =====================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔵 Login attempt for:', email);
    console.log('🔵 Password received:', password);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      attributes: ['user_id', 'full_name', 'email', 'phone', 'password_hash', 'role', 'status', 'profile_image']
    });

    if (!user) {
      console.log('❌ User not found:', email);
      securityLogger.logAuth('Login Failed - User Not Found', null, false, { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // ⚠️ TEMPORARY: Bypass password check for demo accounts
    const demoAccounts = {
      'admin@petcareplus.lk': 'Admin@123',
      'vet@petcareplus.lk': 'Vet@123',
      'reception@petcareplus.lk': 'Reception@123'
    };

    let isValidPassword = false;

    if (demoAccounts[email]) {
      // Check if password matches demo password (TEMPORARY)
      if (password === demoAccounts[email]) {
        console.log('✅ Demo account login accepted (bypassing bcrypt)');
        isValidPassword = true;
      } else {
        console.log('❌ Demo password incorrect. Expected:', demoAccounts[email]);
        isValidPassword = false;
      }
    } else {
      // Use bcrypt for other accounts
      console.log('🔐 Using bcrypt verification for non-demo account');
      isValidPassword = await verifyPassword(password, user.password_hash);
      console.log('🔐 Bcrypt result:', isValidPassword);
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      securityLogger.logAuth('Login Failed - Invalid Password', user.user_id, false, { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check account status
    if (user.status !== 'Active') {
      console.log('❌ Account not active. Status:', user.status);
      securityLogger.logAuth('Login Failed - Inactive Account', user.user_id, false, { 
        email, 
        status: user.status 
      });
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Please contact administrator.`,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Login successful for:', user.email);

    // Generate tokens
    const accessToken = generateToken(user.user_id, user.role);
    const refreshToken = generateRefreshToken(user.user_id);

    // Save refresh token to database
    await RefreshToken.create({
      user_id: user.user_id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Update last login
    await user.update({ updated_at: new Date() });

    // Log successful login
    securityLogger.logAuth('Login Successful', user.user_id, true, { email, role: user.role });

    // Prepare user response (exclude password_hash)
    const userResponse = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile_image: user.profile_image
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    securityLogger.logError('Login Error', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// REGISTER (Admin only)
// =====================================================
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Validate input
    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash,
      role,
      status: 'Active',
      email_verified: false
    });

    securityLogger.logAuth('User Registered', user.user_id, true, { email, role });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Register error:', error);
    securityLogger.logError('Registration Error', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// LOGOUT
// =====================================================
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Delete refresh token from database
    await RefreshToken.destroy({
      where: { token: refreshToken }
    });

    securityLogger.logAuth('Logout Successful', req.user?.user_id, true);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// REFRESH TOKEN
// =====================================================
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken }
    });

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }

    // Check if token expired
    if (new Date() > tokenRecord.expires_at) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        timestamp: new Date().toISOString()
      });
    }

    // Get user
    const user = await User.findByPk(decoded.user_id);

    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new access token
    const accessToken = generateToken(user.user_id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'email_verified']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, profile_image } = req.body;

    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Update user
    await user.update({
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      profile_image: profile_image || user.profile_image
    });

    securityLogger.logAuth('Profile Updated', user.user_id, true);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profile_image: user.profile_image
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        timestamp: new Date().toISOString()
      });
    }

    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(current_password, user.password_hash);

    if (!isValidPassword) {
      securityLogger.logAuth('Password Change Failed - Invalid Current Password', user.user_id, false);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const new_password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await user.update({ password_hash: new_password_hash });

    // Delete all refresh tokens for this user (logout from all devices)
    await RefreshToken.destroy({
      where: { user_id: user.user_id }
    });

    securityLogger.logAuth('Password Changed Successfully', user.user_id, true);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword
};
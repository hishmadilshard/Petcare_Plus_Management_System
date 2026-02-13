const { User, PetOwner, RefreshToken } = require('../models');
const { verifyPassword } = require('../utils/encryption');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, error, validationError } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, address, city, postal_code } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        timestamp: new Date().toISOString()
      });
    }

    // Create user
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash: password, // Will be hashed by model hook
      role: role || 'Owner',
      status: 'Active'
    });

    // If registering as pet owner, create owner profile
    if (user.role === 'Owner') {
      await PetOwner.create({
        user_id: user.user_id,
        address: address || null,
        city: city || null,
        postal_code: postal_code || null,
        registered_date: new Date()
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await RefreshToken.create({
      user_id: user.user_id,
      token: refreshToken,
      expires_at: expiresAt
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.full_name, user.role).catch(err => {
      console.error('Welcome email failed:', err);
    });

    // Log successful registration
    securityLogger.logAuth('User Registered', user.user_id, true, {
      email: user.email,
      role: user.role
    });

    return success(res, {
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }, 'Registration successful', 201);

  } catch (err) {
    securityLogger.error('Registration error', { error: err.message });
    return error(res, 'Registration failed', 500);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      attributes: ['user_id', 'full_name', 'email', 'phone', 'password_hash', 'role', 'status', 'profile_image']
    });

    if (!user) {
      securityLogger.logAuth('Login Failed - User Not Found', null, false, { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check account status
    if (user.status !== 'Active') {
      securityLogger.logAuth('Login Failed - Inactive Account', user.user_id, false, {
        email,
        status: user.status
      });
      return res.status(403).json({
        success: false,
        message: 'Account is inactive or suspended',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      securityLogger.logAuth('Login Failed - Invalid Password', user.user_id, false, { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      user_id: user.user_id,
      token: refreshToken,
      expires_at: expiresAt
    });

    // Update last login
    await User.update(
      { last_login: new Date() },
      { where: { user_id: user.user_id } }
    );

    // Log successful login
    securityLogger.logAuth('Login Successful', user.user_id, true, {
      email: user.email,
      role: user.role
    });

    return success(res, {
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }, 'Login successful');

  } catch (err) {
    securityLogger.error('Login error', { error: err.message });
    return error(res, 'Login failed', 500);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken, user_id: decoded.id }
    });

    if (!tokenRecord) {
      securityLogger.warn('Invalid refresh token attempt', { userId: decoded.id });
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }

    // Check if token expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await RefreshToken.destroy({ where: { token_id: tokenRecord.token_id } });
      return res.status(403).json({
        success: false,
        message: 'Refresh token expired',
        timestamp: new Date().toISOString()
      });
    }

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    securityLogger.info('Access token refreshed', { userId: user.user_id });

    return success(res, {
      accessToken: newAccessToken
    }, 'Token refreshed successfully');

  } catch (err) {
    securityLogger.error('Token refresh error', { error: err.message });
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (refreshToken) {
      // Delete refresh token from database
      await RefreshToken.destroy({
        where: { token: refreshToken, user_id: userId }
      });
    }

    securityLogger.logAuth('User Logged Out', userId, true);

    return success(res, null, 'Logout successful');

  } catch (err) {
    securityLogger.error('Logout error', { error: err.message, userId: req.user?.id });
    return error(res, 'Logout failed', 500);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'created_at', 'last_login'],
      include: [
        {
          model: PetOwner,
          as: 'ownerProfile',
          attributes: ['owner_id', 'address', 'city', 'postal_code', 'emergency_contact', 'registered_date']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    return success(res, { user }, 'User profile retrieved');

  } catch (err) {
    securityLogger.error('Get current user error', { error: err.message, userId: req.user?.id });
    return error(res, 'Failed to retrieve user profile', 500);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, address, city, postal_code, emergency_contact } = req.body;

    // Update user
    await User.update(
      { full_name, phone },
      { where: { user_id: userId } }
    );

    // Update pet owner profile if exists
    const owner = await PetOwner.findOne({ where: { user_id: userId } });
    if (owner) {
      await PetOwner.update(
        { address, city, postal_code, emergency_contact },
        { where: { user_id: userId } }
      );
    }

    // Get updated user
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: PetOwner, as: 'ownerProfile' }]
    });

    securityLogger.info('Profile updated', { userId });

    return success(res, { user: updatedUser }, 'Profile updated successfully');

  } catch (err) {
    securityLogger.error('Update profile error', { error: err.message, userId: req.user?.id });
    return error(res, 'Failed to update profile', 500);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'password_hash']
    });

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      securityLogger.warn('Password change failed - incorrect current password', { userId });
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Update password
    await User.update(
      { password_hash: newPassword }, // Will be hashed by model hook
      { where: { user_id: userId } }
    );

    // Delete all refresh tokens (force re-login on all devices)
    await RefreshToken.destroy({ where: { user_id: userId } });

    securityLogger.logAuth('Password Changed', userId, true);

    return success(res, null, 'Password changed successfully. Please login again.');

  } catch (err) {
    securityLogger.error('Change password error', { error: err.message, userId: req.user?.id });
    return error(res, 'Failed to change password', 500);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword
};
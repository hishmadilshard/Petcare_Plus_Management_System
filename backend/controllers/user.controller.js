const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { securityLogger } = require('../utils/logger');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      timestamp: new Date().toISOString()
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'email_verified', 'created_at', 'updated_at']
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
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      timestamp: new Date().toISOString()
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, status } = req.body;

    // Validate required fields
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
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash,
      role,
      status: status || 'Active',
      email_verified: false
    });

    securityLogger.logAuth('User Created', user.user_id, true, {
      created_by: req.user.user_id,
      user_email: email,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      timestamp: new Date().toISOString()
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, password, role, status } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare update data
    const updateData = {
      full_name: full_name || user.full_name,
      phone: phone || user.phone,
      role: role || user.role,
      status: status || user.status
    };

    // Update password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    // Update user
    await user.update(updateData);

    securityLogger.logAuth('User Updated', user.user_id, true, {
      updated_by: req.user.user_id,
      changes: Object.keys(updateData)
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      timestamp: new Date().toISOString()
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
        timestamp: new Date().toISOString()
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const userEmail = user.email;

    // Delete user
    await user.destroy();

    securityLogger.logAuth('User Deleted', id, true, {
      deleted_by: req.user.user_id,
      deleted_user_email: userEmail
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
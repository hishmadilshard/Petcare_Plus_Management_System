const { User } = require('../models');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get all users error:', error);
    logger.error('Get all users error', { error: error.message, stack: error.stack });
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
      attributes: { exclude: ['password_hash'] }
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
    logger.error('Get user by ID error', { error: error.message, stack: error.stack });
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
    const {
      full_name,
      email,
      phone,
      password,
      role,
      status,
      profile_image
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, phone, password, and role are required',
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

    // Hash password using encryption utility
    const password_hash = await encryption.hashPassword(password);

    // Create user
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash,
      role,
      status: status || 'Active',
      profile_image
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    logger.info(`User created: ${user.email} by ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create user error:', error);
    logger.error('Create user error', { error: error.message, stack: error.stack });
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
    const {
      full_name,
      email,
      phone,
      password,
      role,
      status,
      profile_image
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Prepare update data
    const updateData = {
      full_name: full_name || user.full_name,
      email: email || user.email,
      phone: phone || user.phone,
      role: role || user.role,
      status: status || user.status,
      profile_image: profile_image !== undefined ? profile_image : user.profile_image
    };

    // Hash new password if provided using encryption utility
    if (password) {
      updateData.password_hash = await encryption.hashPassword(password);
    }

    // Update user
    await user.update(updateData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: userResponse },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user error:', error);
    logger.error('Update user error', { error: error.message, stack: error.stack });
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

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Prevent deleting yourself
    if (user.user_id === req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account',
        timestamp: new Date().toISOString()
      });
    }

    await user.destroy();

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete user error:', error);
    logger.error('Delete user error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      timestamp: new Date().toISOString()
    });
  }
};

// Change user status
const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Active, Inactive, Suspended)',
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

    // Prevent changing your own status
    if (user.user_id === req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own status',
        timestamp: new Date().toISOString()
      });
    }

    await user.update({ status });

    logger.info(`User status changed: ${user.email} to ${status} by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Change user status error:', error);
    logger.error('Change user status error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to change user status',
      timestamp: new Date().toISOString()
    });
  }
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'Active' } });
    const inactiveUsers = await User.count({ where: { status: 'Inactive' } });
    const suspendedUsers = await User.count({ where: { status: 'Suspended' } });

    const adminCount = await User.count({ where: { role: 'Admin' } });
    const vetCount = await User.count({ where: { role: 'Vet' } });
    const receptionistCount = await User.count({ where: { role: 'Receptionist' } });

    return res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        byRole: {
          admin: adminCount,
          vet: vetCount,
          receptionist: receptionistCount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    logger.error('Get user statistics error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  getUserStatistics
};
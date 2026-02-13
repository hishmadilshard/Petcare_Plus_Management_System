const { User, PetOwner, Pet } = require('../models');
const { success, error, notFound } = require('../utils/responseHandler');
const securityLogger = require('../utils/securityLogger');
const { Op } = require('sequelize');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'created_at', 'last_login'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return success(res, {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    }, 'Users retrieved successfully');

  } catch (err) {
    securityLogger.error('Get all users error', { error: err.message });
    return error(res, 'Failed to retrieve users', 500);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'status', 'profile_image', 'created_at', 'last_login'],
      include: [
        {
          model: PetOwner,
          as: 'ownerProfile',
          attributes: ['owner_id', 'address', 'city', 'postal_code', 'emergency_contact', 'registered_date'],
          include: [
            {
              model: Pet,
              as: 'pets',
              attributes: ['pet_id', 'pet_name', 'species', 'breed', 'age', 'gender', 'status', 'profile_image']
            }
          ]
        }
      ]
    });

    if (!user) {
      return notFound(res, 'User');
    }

    securityLogger.logDataAccess(req.user.id, 'User', id, 'READ');

    return success(res, { user }, 'User retrieved successfully');

  } catch (err) {
    securityLogger.error('Get user by ID error', { error: err.message, userId: req.params.id });
    return error(res, 'Failed to retrieve user', 500);
  }
};

/**
 * Create new user (Admin only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, status } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create user
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash: password,
      role,
      status: status || 'Active'
    });

    // Create pet owner profile if role is Owner
    if (user.role === 'Owner') {
      await PetOwner.create({
        user_id: user.user_id,
        registered_date: new Date()
      });
    }

    securityLogger.info('User created by admin', {
      createdBy: req.user.id,
      newUserId: user.user_id,
      role: user.role
    });

    return success(res, { user }, 'User created successfully', 201);

  } catch (err) {
    securityLogger.error('Create user error', { error: err.message });
    return error(res, 'Failed to create user', 500);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return notFound(res, 'User');
    }

    // Update user
    await User.update(
      { full_name, phone, role, status },
      { where: { user_id: id } }
    );

    const updatedUser = await User.findByPk(id);

    securityLogger.info('User updated', {
      updatedBy: req.user.id,
      userId: id
    });

    return success(res, { user: updatedUser }, 'User updated successfully');

  } catch (err) {
    securityLogger.error('Update user error', { error: err.message, userId: req.params.id });
    return error(res, 'Failed to update user', 500);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return notFound(res, 'User');
    }

    // Prevent deleting own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        timestamp: new Date().toISOString()
      });
    }

    // Delete user (cascade will handle related records)
    await User.destroy({ where: { user_id: id } });

    securityLogger.warn('User deleted', {
      deletedBy: req.user.id,
      userId: id,
      email: user.email
    });

    return success(res, null, 'User deleted successfully');

  } catch (err) {
    securityLogger.error('Delete user error', { error: err.message, userId: req.params.id });
    return error(res, 'Failed to delete user', 500);
  }
};

/**
 * Get users by role
 * GET /api/users/role/:role
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['Admin', 'Vet', 'Receptionist', 'Owner'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        timestamp: new Date().toISOString()
      });
    }

    const users = await User.findAll({
      where: { role, status: 'Active' },
      attributes: ['user_id', 'full_name', 'email', 'phone', 'profile_image'],
      order: [['full_name', 'ASC']]
    });

    return success(res, { users }, `${role}s retrieved successfully`);

  } catch (err) {
    securityLogger.error('Get users by role error', { error: err.message });
    return error(res, 'Failed to retrieve users', 500);
  }
};

/**
 * Get all veterinarians (for appointment booking)
 * GET /api/users/vets
 */
const getVeterinarians = async (req, res) => {
  try {
    const vets = await User.findAll({
      where: { role: 'Vet', status: 'Active' },
      attributes: ['user_id', 'full_name', 'email', 'phone', 'profile_image'],
      order: [['full_name', 'ASC']]
    });

    return success(res, { vets }, 'Veterinarians retrieved successfully');

  } catch (err) {
    securityLogger.error('Get veterinarians error', { error: err.message });
    return error(res, 'Failed to retrieve veterinarians', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getVeterinarians
};
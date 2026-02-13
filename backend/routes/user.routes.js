const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { adminOnly, staffOnly } = require('../middleware/verifyRole');
const { validateIdParam } = require('../middleware/validation');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authenticateToken, adminOnly, userController.getAllUsers);

/**
 * @route   GET /api/users/vets
 * @desc    Get all veterinarians
 * @access  Private (Staff + Owners)
 */
router.get('/vets', authenticateToken, userController.getVeterinarians);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private (Admin only)
 */
router.get('/role/:role', authenticateToken, adminOnly, userController.getUsersByRole);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Staff only)
 */
router.get('/:id', authenticateToken, staffOnly, validateIdParam, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, adminOnly, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, adminOnly, validateIdParam, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, adminOnly, validateIdParam, userController.deleteUser);

module.exports = router;
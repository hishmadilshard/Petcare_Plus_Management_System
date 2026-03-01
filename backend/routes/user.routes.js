const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and rate limiting
router.use(apiLimiter);
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize(['Admin']), userController.getAllUsers);

// Get user by ID (Admin only)
router.get('/:id', authorize(['Admin']), userController.getUserById);

// Create new user (Admin only)
router.post('/', authorize(['Admin']), userController.createUser);

// Update user (Admin only)
router.put('/:id', authorize(['Admin']), userController.updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize(['Admin']), userController.deleteUser);

module.exports = router;
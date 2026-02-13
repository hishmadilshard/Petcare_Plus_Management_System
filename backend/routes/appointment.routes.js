const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { staffOnly, vetOnly } = require('../middleware/verifyRole');
const {
  validateAppointment,
  validateIdParam,
  validatePagination,
  validateDateRange
} = require('../middleware/validation');

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, validateDateRange, appointmentController.getAllAppointments);

/**
 * @route   GET /api/appointments/upcoming
 * @desc    Get upcoming appointments
 * @access  Private
 */
router.get('/upcoming', authenticateToken, appointmentController.getUpcomingAppointments);

/**
 * @route   GET /api/appointments/date/:date
 * @desc    Get appointments by date
 * @access  Private (Staff only)
 */
router.get('/date/:date', authenticateToken, staffOnly, appointmentController.getAppointmentsByDate);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, appointmentController.getAppointmentById);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post('/', authenticateToken, validateAppointment, appointmentController.createAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put('/:id', authenticateToken, validateIdParam, appointmentController.updateAppointment);

/**
 * @route   PUT /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private
 */
router.put('/:id/cancel', authenticateToken, validateIdParam, appointmentController.cancelAppointment);

/**
 * @route   PUT /api/appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private (Staff only)
 */
router.put('/:id/complete', authenticateToken, staffOnly, validateIdParam, appointmentController.completeAppointment);

module.exports = router;
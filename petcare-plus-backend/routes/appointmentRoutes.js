const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getTodayAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getCalendarView,
  getAvailableSlots,
} = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, getAllAppointments);
router.get('/today', verifyToken, getTodayAppointments);
router.get('/calendar', verifyToken, getCalendarView);
router.get('/available-slots', verifyToken, getAvailableSlots);
router.get('/:id', verifyToken, getAppointmentById);
router.post('/', verifyToken, createAppointment);
router.put('/:id', verifyToken, updateAppointment);
router.patch('/:id/cancel', verifyToken, cancelAppointment);

module.exports = router;
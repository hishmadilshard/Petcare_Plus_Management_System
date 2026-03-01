const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const petRoutes = require('./pet.routes');
const appointmentRoutes = require('./appointment.routes');
const medicalRecordRoutes = require('./medicalRecord.routes');
const vaccinationRoutes = require('./vaccination.routes');
const inventoryRoutes = require('./inventory.routes');
const invoiceRoutes = require('./invoice.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PetCare Plus API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pets', petRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/vaccinations', vaccinationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PetCare Plus Management System API',
    version: API_VERSION,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      pets: '/api/pets',
      appointments: '/api/appointments',
      medicalRecords: '/api/medical-records',
      vaccinations: '/api/vaccinations',
      inventory: '/api/inventory',
      invoices: '/api/invoices',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard'
    },
    documentation: 'https://github.com/yourusername/petcare-plus-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
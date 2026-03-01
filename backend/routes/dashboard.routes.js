const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(authenticate);

router.get('/admin', authorize(['Admin']), dashboardController.getAdminDashboard);
router.get('/vet', authorize(['Admin', 'Vet']), dashboardController.getVetDashboard);
router.get('/receptionist', authorize(['Admin', 'Receptionist']), dashboardController.getReceptionistDashboard);

module.exports = router;

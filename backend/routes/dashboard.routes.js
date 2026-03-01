const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { adminOnly, staffOnly } = require('../middleware/verifyRole');

router.get('/admin', authenticateToken, adminOnly, dashboardController.getAdminDashboard);
router.get('/vet', authenticateToken, dashboardController.getVetDashboard);
router.get('/receptionist', authenticateToken, staffOnly, dashboardController.getReceptionistDashboard);

module.exports = router;

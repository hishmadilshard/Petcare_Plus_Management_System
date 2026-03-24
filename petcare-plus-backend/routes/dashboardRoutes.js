const express = require('express');
const router = express.Router();
const { getDashboardStats, getReports } = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('Admin', 'Vet', 'Receptionist'), getDashboardStats);
router.get('/reports', verifyToken, authorizeRoles('Admin', 'Receptionist'), getReports);

module.exports = router;
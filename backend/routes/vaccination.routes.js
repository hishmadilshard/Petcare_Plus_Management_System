const express = require('express');
const router = express.Router();
const vaccinationController = require('../controllers/vaccination.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { vetOnly, staffOnly } = require('../middleware/verifyRole');
const {
  validateVaccination,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/vaccinations
 * @desc    Get all vaccinations
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, vaccinationController.getAllVaccinations);

/**
 * @route   GET /api/vaccinations/due
 * @desc    Get due vaccinations
 * @access  Private (Staff only)
 */
router.get('/due', authenticateToken, staffOnly, vaccinationController.getDueVaccinations);

/**
 * @route   GET /api/vaccinations/pet/:petId
 * @desc    Get vaccinations by pet
 * @access  Private
 */
router.get('/pet/:petId', authenticateToken, validateIdParam, vaccinationController.getVaccinationsByPet);

/**
 * @route   GET /api/vaccinations/:id
 * @desc    Get vaccination by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, vaccinationController.getVaccinationById);

/**
 * @route   POST /api/vaccinations
 * @desc    Create vaccination record
 * @access  Private (Vet only)
 */
router.post('/', authenticateToken, vetOnly, validateVaccination, vaccinationController.createVaccination);

/**
 * @route   POST /api/vaccinations/send-reminders
 * @desc    Send vaccination reminders
 * @access  Private (Staff only)
 */
router.post('/send-reminders', authenticateToken, staffOnly, vaccinationController.sendVaccinationReminders);

/**
 * @route   PUT /api/vaccinations/:id
 * @desc    Update vaccination
 * @access  Private (Vet only)
 */
router.put('/:id', authenticateToken, vetOnly, validateIdParam, vaccinationController.updateVaccination);

/**
 * @route   DELETE /api/vaccinations/:id
 * @desc    Delete vaccination
 * @access  Private (Vet only)
 */
router.delete('/:id', authenticateToken, vetOnly, validateIdParam, vaccinationController.deleteVaccination);

module.exports = router;
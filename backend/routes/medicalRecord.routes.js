const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecord.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { vetOnly, staffOnly } = require('../middleware/verifyRole');
const {
  validateMedicalRecord,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/medical-records
 * @desc    Get all medical records
 * @access  Private (Staff only)
 */
router.get('/', authenticateToken, staffOnly, validatePagination, medicalRecordController.getAllMedicalRecords);

/**
 * @route   GET /api/medical-records/pet/:petId
 * @desc    Get medical records by pet
 * @access  Private
 */
router.get('/pet/:petId', authenticateToken, validateIdParam, medicalRecordController.getMedicalRecordsByPet);

/**
 * @route   GET /api/medical-records/:id
 * @desc    Get medical record by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, medicalRecordController.getMedicalRecordById);

/**
 * @route   POST /api/medical-records
 * @desc    Create medical record
 * @access  Private (Vet only)
 */
router.post('/', authenticateToken, vetOnly, validateMedicalRecord, medicalRecordController.createMedicalRecord);

/**
 * @route   PUT /api/medical-records/:id
 * @desc    Update medical record
 * @access  Private (Vet only)
 */
router.put('/:id', authenticateToken, vetOnly, validateIdParam, medicalRecordController.updateMedicalRecord);

/**
 * @route   DELETE /api/medical-records/:id
 * @desc    Delete medical record
 * @access  Private (Vet only)
 */
router.delete('/:id', authenticateToken, vetOnly, validateIdParam, medicalRecordController.deleteMedicalRecord);

module.exports = router;
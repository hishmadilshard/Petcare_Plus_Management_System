const express = require('express');
const router = express.Router();
const petController = require('../controllers/pet.controller');
const { authenticateToken } = require('../middleware/authJwt');
const { staffOnly, verifyOwnership } = require('../middleware/verifyRole');
const {
  validatePetRegistration,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/pets
 * @desc    Get all pets
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, petController.getAllPets);

/**
 * @route   GET /api/pets/owner/:ownerId
 * @desc    Get pets by owner
 * @access  Private
 */
router.get('/owner/:ownerId', authenticateToken, petController.getPetsByOwner);

/**
 * @route   GET /api/pets/:id
 * @desc    Get pet by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateIdParam, petController.getPetById);

/**
 * @route   GET /api/pets/:id/medical-history
 * @desc    Get pet's complete medical history
 * @access  Private
 */
router.get('/:id/medical-history', authenticateToken, validateIdParam, petController.getPetMedicalHistory);

/**
 * @route   POST /api/pets
 * @desc    Register new pet
 * @access  Private
 */
router.post('/', authenticateToken, validatePetRegistration, petController.createPet);

/**
 * @route   PUT /api/pets/:id
 * @desc    Update pet
 * @access  Private
 */
router.put('/:id', authenticateToken, validateIdParam, petController.updatePet);

/**
 * @route   DELETE /api/pets/:id
 * @desc    Delete pet (soft delete)
 * @access  Private (Staff only)
 */
router.delete('/:id', authenticateToken, staffOnly, validateIdParam, petController.deletePet);

module.exports = router;
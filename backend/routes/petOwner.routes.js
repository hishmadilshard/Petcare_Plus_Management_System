const express = require('express');
const router = express.Router();
const petOwnerController = require('../controllers/petOwner.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Pet owner routes
router.get('/', petOwnerController.getAllPetOwners);
router.get('/:id', petOwnerController.getPetOwnerById);
router.post('/', petOwnerController.createPetOwner);
router.put('/:id', petOwnerController.updatePetOwner);
router.delete('/:id', petOwnerController.deletePetOwner);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getVaccinations,
  getDueVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination,
} = require('../controllers/vaccinationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/due', verifyToken, getDueVaccinations);
router.get('/pet/:pet_id', verifyToken, getVaccinations);
router.post('/', verifyToken, authorizeRoles('Admin', 'Vet'), createVaccination);
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Vet'), updateVaccination);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteVaccination);

module.exports = router;
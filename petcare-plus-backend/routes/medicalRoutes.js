const express = require('express');
const router  = express.Router();
const {
  getMedicalRecordsByPet,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalController');
const { verifyToken } = require('../middleware/auth');

router.get('/pet/:pet_id', verifyToken, getMedicalRecordsByPet);
router.get('/:id',         verifyToken, getMedicalRecordById);
router.post('/',           verifyToken, createMedicalRecord);
router.put('/:id',         verifyToken, updateMedicalRecord);
router.delete('/:id',      verifyToken, deleteMedicalRecord);



module.exports = router;
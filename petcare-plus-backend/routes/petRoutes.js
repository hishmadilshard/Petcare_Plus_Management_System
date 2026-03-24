const express = require('express');
const router = express.Router();
const {
  getAllPets, getPetById, createPet,
  updatePet, deletePet, regenerateQR, getPetPublicProfile,
} = require('../controllers/petController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public — QR scan
router.get('/:id/profile', getPetPublicProfile);

// Protected
router.get('/', verifyToken, getAllPets);
router.get('/:id', verifyToken, getPetById);
router.post('/', verifyToken, authorizeRoles('Admin', 'Vet', 'Receptionist'), createPet);
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Vet', 'Receptionist'), updatePet);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deletePet);
router.post('/:id/regenerate-qr', verifyToken, authorizeRoles('Admin', 'Vet', 'Receptionist'), regenerateQR);

// ── QR Code Download ──────────────────────────────────────
router.get('/:id/qr-download', async (req, res) => {
  try {
    const db = require('../config/db');
    const [pets] = await db.query(
      'SELECT pet_name, qr_code FROM pets WHERE pet_id = ?',
      [req.params.id]
    );
    if (!pets.length || !pets[0].qr_code) {
      return res.status(404).json({ message: 'QR not found.' });
    }
    const base64Data = pets[0].qr_code
      .replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition',
      `attachment; filename="${pets[0].pet_name}_QR.png"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
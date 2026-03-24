const express = require('express');
const router = express.Router();
const {
  getAllOwners, getOwnerById,
  createOwner, updateOwner, deleteOwner,
} = require('../controllers/ownerController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, authorizeRoles('Admin', 'Vet', 'Receptionist'), getAllOwners);
router.get('/:id', verifyToken, getOwnerById);
router.post('/', verifyToken, authorizeRoles('Admin', 'Receptionist'), createOwner);
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Receptionist'), updateOwner);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteOwner);

module.exports = router;
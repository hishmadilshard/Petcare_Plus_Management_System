const { forbidden } = require('../utils/responseHandler');
const db = require('../config/database');

const roleHierarchy = {
  'Admin': 4,
  'Vet': 3,
  'Receptionist': 2,
  'Owner': 1
};

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required', timestamp: new Date().toISOString() });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
    next();
  };
};

const verifyMinRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const minimumRoleLevel = roleHierarchy[minimumRole] || 0;
    if (userRoleLevel < minimumRoleLevel) {
      return forbidden(res, `Insufficient permissions. Minimum role required: ${minimumRole}`);
    }
    next();
  };
};

const verifyOwnership = (resourceType = 'resource') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      if (['Admin', 'Vet', 'Receptionist'].includes(userRole)) {
        return next();
      }

      const resourceId = req.params.id || req.params.petId || req.params.ownerId;
      if (!resourceId) {
        return res.status(400).json({ success: false, message: 'Resource ID required for ownership verification' });
      }

      let isOwner = false;

      switch (resourceType) {
        case 'pet': {
          const [rows] = await db.query(
            'SELECT p.pet_id FROM pets p JOIN pet_owners po ON p.owner_id = po.owner_id WHERE p.pet_id = ? AND po.user_id = ?',
            [resourceId, userId]
          );
          isOwner = rows.length > 0;
          break;
        }
        case 'appointment': {
          const [rows] = await db.query(
            'SELECT a.appointment_id FROM appointments a JOIN pets p ON a.pet_id = p.pet_id JOIN pet_owners po ON p.owner_id = po.owner_id WHERE a.appointment_id = ? AND po.user_id = ?',
            [resourceId, userId]
          );
          isOwner = rows.length > 0;
          break;
        }
        case 'owner': {
          const [rows] = await db.query(
            'SELECT owner_id FROM pet_owners WHERE owner_id = ? AND user_id = ?',
            [resourceId, userId]
          );
          isOwner = rows.length > 0;
          break;
        }
        default:
          isOwner = false;
      }

      if (!isOwner) {
        return forbidden(res, 'You do not have permission to access this resource');
      }
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error verifying resource ownership' });
    }
  };
};

const adminOnly = verifyRole('Admin');
const staffOnly = verifyRole('Admin', 'Vet', 'Receptionist');
const vetOnly = verifyRole('Admin', 'Vet');

module.exports = { verifyRole, verifyMinRole, verifyOwnership, adminOnly, staffOnly, vetOnly, roleHierarchy };
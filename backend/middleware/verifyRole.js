const securityLogger = require('../utils/securityLogger');
const { forbidden } = require('../utils/responseHandler');

/**
 * Role hierarchy (higher number = more privileges)
 */
const roleHierarchy = {
  'Admin': 4,
  'Vet': 3,
  'Receptionist': 2,
  'Owner': 1
};

/**
 * Verify user has required role(s)
 * @param  {...string} allowedRoles - Roles that can access the route
 */
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      securityLogger.warn('Role verification without authentication', {
        endpoint: req.originalUrl,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userRole = req.user.role;

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      securityLogger.logAccess(
        req.user.id,
        req.originalUrl,
        req.method,
        false,
        {
          userRole,
          requiredRoles: allowedRoles,
          ip: req.ip
        }
      );

      return forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    // Log successful access
    securityLogger.logAccess(
      req.user.id,
      req.originalUrl,
      req.method,
      true,
      { userRole }
    );

    next();
  };
};

/**
 * Verify user has minimum role level
 * @param {string} minimumRole - Minimum required role
 */
const verifyMinRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const minimumRoleLevel = roleHierarchy[minimumRole] || 0;

    if (userRoleLevel < minimumRoleLevel) {
      securityLogger.logAccess(
        req.user.id,
        req.originalUrl,
        req.method,
        false,
        {
          userRole: req.user.role,
          minimumRequired: minimumRole,
          ip: req.ip
        }
      );

      return forbidden(res, `Insufficient permissions. Minimum role required: ${minimumRole}`);
    }

    next();
  };
};

/**
 * Verify user owns the resource or has admin/staff privileges
 */
const verifyOwnership = (resourceType = 'resource') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admins, Vets, and Receptionists can access all resources
      if (['Admin', 'Vet', 'Receptionist'].includes(userRole)) {
        return next();
      }

      // For pet owners, verify they own the resource
      const resourceId = req.params.id || req.params.petId || req.params.ownerId;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required for ownership verification'
        });
      }

      // Import models dynamically to avoid circular dependencies
      const { User, PetOwner, Pet, Appointment } = require('../models');

      let isOwner = false;

      // Check ownership based on resource type
      switch (resourceType) {
        case 'pet':
          const pet = await Pet.findOne({
            where: { pet_id: resourceId },
            include: [{
              model: PetOwner,
              required: true,
              where: { user_id: userId }
            }]
          });
          isOwner = !!pet;
          break;

        case 'appointment':
          const appointment = await Appointment.findOne({
            where: { appointment_id: resourceId },
            include: [{
              model: Pet,
              required: true,
              include: [{
                model: PetOwner,
                required: true,
                where: { user_id: userId }
              }]
            }]
          });
          isOwner = !!appointment;
          break;

        case 'owner':
          const owner = await PetOwner.findOne({
            where: {
              owner_id: resourceId,
              user_id: userId
            }
          });
          isOwner = !!owner;
          break;

        default:
          // Generic ownership check - assume user_id field
          isOwner = false;
      }

      if (!isOwner) {
        securityLogger.warn('Ownership verification failed', {
          userId,
          resourceType,
          resourceId,
          ip: req.ip,
          endpoint: req.originalUrl
        });

        return forbidden(res, 'You do not have permission to access this resource');
      }

      next();

    } catch (error) {
      securityLogger.error('Ownership verification error', {
        error: error.message,
        userId: req.user.id,
        endpoint: req.originalUrl
      });

      return res.status(500).json({
        success: false,
        message: 'Error verifying resource ownership'
      });
    }
  };
};

/**
 * Admin-only access
 */
const adminOnly = verifyRole('Admin');

/**
 * Staff access (Admin, Vet, Receptionist)
 */
const staffOnly = verifyRole('Admin', 'Vet', 'Receptionist');

/**
 * Vet and Admin only
 */
const vetOnly = verifyRole('Admin', 'Vet');

module.exports = {
  verifyRole,
  verifyMinRole,
  verifyOwnership,
  adminOnly,
  staffOnly,
  vetOnly,
  roleHierarchy
};
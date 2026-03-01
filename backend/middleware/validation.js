const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// User validation
const validateUser = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('password')
    .if(body('password').exists())
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['Admin', 'Vet', 'Receptionist'])
    .withMessage('Role must be Admin, Vet, or Receptionist'),
  handleValidationErrors
];

// Pet owner validation
const validatePetOwner = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  handleValidationErrors
];

// Pet validation
const validatePet = [
  body('owner_id')
    .notEmpty()
    .withMessage('Owner ID is required')
    .isInt()
    .withMessage('Owner ID must be a number'),
  body('pet_name')
    .trim()
    .notEmpty()
    .withMessage('Pet name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Pet name must be between 1 and 100 characters'),
  body('species')
    .isIn(['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'])
    .withMessage('Invalid species'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateChangePassword,
  validateUser,
  validatePetOwner,
  validatePet,
  // Simple pass-through validators for routes that need them
  validateAppointment: (req, res, next) => {
    const { pet_id, appointment_date, service_type } = req.body;
    if (!pet_id) return res.status(400).json({ success: false, message: 'Pet ID is required' });
    if (!appointment_date) return res.status(400).json({ success: false, message: 'Appointment date is required' });
    if (!service_type) return res.status(400).json({ success: false, message: 'Service type is required' });
    next();
  },
  validateMedicalRecord: (req, res, next) => {
    const { pet_id, diagnosis } = req.body;
    if (!pet_id) return res.status(400).json({ success: false, message: 'Pet ID is required' });
    if (!diagnosis) return res.status(400).json({ success: false, message: 'Diagnosis is required' });
    next();
  },
  validateVaccination: (req, res, next) => {
    const { pet_id, vaccine_name, given_date } = req.body;
    if (!pet_id) return res.status(400).json({ success: false, message: 'Pet ID is required' });
    if (!vaccine_name) return res.status(400).json({ success: false, message: 'Vaccine name is required' });
    if (!given_date) return res.status(400).json({ success: false, message: 'Given date is required' });
    next();
  },
  validateInvoice: (req, res, next) => {
    const { owner_id, total_amount } = req.body;
    if (!owner_id) return res.status(400).json({ success: false, message: 'Owner ID is required' });
    if (!total_amount) return res.status(400).json({ success: false, message: 'Total amount is required' });
    next();
  },
  validateIdParam: (req, res, next) => {
    const { id, petId } = req.params;
    const paramId = id || petId;
    if (paramId && isNaN(parseInt(paramId))) {
      return res.status(400).json({ success: false, message: 'Invalid ID parameter' });
    }
    next();
  },
  validatePagination: (req, res, next) => {
    const { page, limit } = req.query;
    if (page && isNaN(parseInt(page))) return res.status(400).json({ success: false, message: 'Invalid page number' });
    if (limit && isNaN(parseInt(limit))) return res.status(400).json({ success: false, message: 'Invalid limit number' });
    next();
  },
  validateDateRange: (req, res, next) => {
    const { startDate, endDate } = req.query;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }
    next();
  }
};
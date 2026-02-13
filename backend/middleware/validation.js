const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss-clean');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * User Registration Validation
 */
const validateUserRegistration = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters')
    .matches(/^[a-zA-Z\s.]+$/).withMessage('Full name can only contain letters, spaces, and dots'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('role')
    .optional()
    .isIn(['Admin', 'Vet', 'Receptionist', 'Owner'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

/**
 * Login Validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Pet Registration Validation
 */
const validatePetRegistration = [
  body('pet_name')
    .trim()
    .notEmpty().withMessage('Pet name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Pet name must be 1-50 characters'),
  
  body('species')
    .trim()
    .notEmpty().withMessage('Species is required')
    .isLength({ min: 2, max: 50 }).withMessage('Species must be 2-50 characters'),
  
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Breed must be less than 50 characters'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Age must be between 0-50'),
  
  body('date_of_birth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date'),
  
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 999.99 }).withMessage('Weight must be a valid number'),
  
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Color must be less than 50 characters'),
  
  handleValidationErrors
];

/**
 * Appointment Validation
 */
const validateAppointment = [
  body('pet_id')
    .notEmpty().withMessage('Pet ID is required')
    .isInt().withMessage('Pet ID must be a valid number'),
  
  body('vet_id')
    .notEmpty().withMessage('Veterinarian ID is required')
    .isInt().withMessage('Veterinarian ID must be a valid number'),
  
  body('appointment_date')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  
  body('appointment_time')
    .notEmpty().withMessage('Appointment time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  
  body('service_type')
    .trim()
    .notEmpty().withMessage('Service type is required')
    .isLength({ min: 2, max: 100 }).withMessage('Service type must be 2-100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  
  handleValidationErrors
];

/**
 * Medical Record Validation
 */
const validateMedicalRecord = [
  body('pet_id')
    .notEmpty().withMessage('Pet ID is required')
    .isInt().withMessage('Pet ID must be valid'),
  
  body('vet_id')
    .notEmpty().withMessage('Veterinarian ID is required')
    .isInt().withMessage('Veterinarian ID must be valid'),
  
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Diagnosis must be less than 2000 characters'),
  
  body('treatment')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Treatment must be less than 2000 characters'),
  
  body('prescription')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Prescription must be less than 1000 characters'),
  
  body('record_date')
    .notEmpty().withMessage('Record date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  handleValidationErrors
];

/**
 * Vaccination Validation
 */
const validateVaccination = [
  body('pet_id')
    .notEmpty().withMessage('Pet ID is required')
    .isInt().withMessage('Pet ID must be valid'),
  
  body('vaccine_name')
    .trim()
    .notEmpty().withMessage('Vaccine name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Vaccine name must be 2-100 characters'),
  
  body('given_date')
    .notEmpty().withMessage('Given date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('next_due_date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('vet_id')
    .notEmpty().withMessage('Veterinarian ID is required')
    .isInt().withMessage('Veterinarian ID must be valid'),
  
  handleValidationErrors
];

/**
 * Invoice Validation
 */
const validateInvoice = [
  body('owner_id')
    .notEmpty().withMessage('Owner ID is required')
    .isInt().withMessage('Owner ID must be valid'),
  
  body('total_amount')
    .notEmpty().withMessage('Total amount is required')
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  
  body('payment_status')
    .optional()
    .isIn(['Pending', 'Paid', 'Partially Paid', 'Cancelled', 'Refunded'])
    .withMessage('Invalid payment status'),
  
  body('invoice_date')
    .notEmpty().withMessage('Invoice date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Valid ID is required'),
  
  handleValidationErrors
];

/**
 * Pagination Validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  
  handleValidationErrors
];

/**
 * Date Range Validation
 */
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601().withMessage('Start date must be valid'),
  
  query('end_date')
    .optional()
    .isISO8601().withMessage('End date must be valid')
    .custom((value, { req }) => {
      if (req.query.start_date && value) {
        const start = new Date(req.query.start_date);
        const end = new Date(value);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateLogin,
  validatePetRegistration,
  validateAppointment,
  validateMedicalRecord,
  validateVaccination,
  validateInvoice,
  validateIdParam,
  validatePagination,
  validateDateRange,
  handleValidationErrors
};
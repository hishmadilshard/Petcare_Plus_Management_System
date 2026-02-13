const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const securityLogger = require('../utils/securityLogger');

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png'],
  documents: ['application/pdf'],
  all: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

/**
 * File filter function
 */
const fileFilter = (allowedTypes = 'all') => {
  return (req, file, cb) => {
    const allowed = ALLOWED_MIME_TYPES[allowedTypes] || ALLOWED_MIME_TYPES.all;

    // Check MIME type
    if (!allowed.includes(file.mimetype)) {
      securityLogger.warn('File upload rejected - invalid type', {
        userId: req.user?.id,
        mimeType: file.mimetype,
        originalName: file.originalname,
        allowedTypes: allowed
      });

      return cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = allowedTypes === 'images' 
      ? ['.jpg', '.jpeg', '.png']
      : allowedTypes === 'documents'
      ? ['.pdf']
      : ['.jpg', '.jpeg', '.png', '.pdf'];
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`), false);
    }

    cb(null, true);
  };
};

/**
 * Storage configuration
 */
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', 'uploads', destination);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    
    filename: (req, file, cb) => {
      // Generate secure random filename
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
      
      cb(null, filename);
    }
  });
};

/**
 * Profile image upload
 */
const uploadProfileImage = multer({
  storage: createStorage('profiles'),
  fileFilter: fileFilter('images'),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('profile_image');

/**
 * Pet image upload
 */
const uploadPetImage = multer({
  storage: createStorage('profiles'),
  fileFilter: fileFilter('images'),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('pet_image');

/**
 * Document upload (medical records, etc.)
 */
const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: fileFilter('all'),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('document');

/**
 * Multiple documents upload
 */
const uploadMultipleDocuments = multer({
  storage: createStorage('documents'),
  fileFilter: fileFilter('all'),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Max 5 files
  }
}).array('documents', 5);

/**
 * Error handler for multer
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum allowed files exceeded',
        timestamp: new Date().toISOString()
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name in file upload',
        timestamp: new Date().toISOString()
      });
    }
  }

  if (err) {
    securityLogger.error('File upload error', {
      error: err.message,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Delete uploaded file
 */
const deleteFile = (filepath) => {
  try {
    const fullPath = path.join(__dirname, '..', filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ File deleted: ${filepath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadProfileImage,
  uploadPetImage,
  uploadDocument,
  uploadMultipleDocuments,
  handleUploadError,
  deleteFile
};
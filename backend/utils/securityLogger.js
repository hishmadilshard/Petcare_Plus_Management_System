const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` | ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// JSON format for file logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const securityLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: { service: 'petcare-plus-api' },
  transports: [
    // Security-specific logs (warnings and errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined logs (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  }));
}

/**
 * Log authentication events
 */
securityLogger.logAuth = (action, userId, success, metadata = {}) => {
  const logData = {
    action,
    userId,
    success,
    ...metadata
  };
  
  if (success) {
    securityLogger.info(`Auth: ${action}`, logData);
  } else {
    securityLogger.warn(`Auth Failed: ${action}`, logData);
  }
};

/**
 * Log access control events
 */
securityLogger.logAccess = (userId, resource, action, allowed, metadata = {}) => {
  const logData = {
    userId,
    resource,
    action,
    allowed,
    ...metadata
  };
  
  if (!allowed) {
    securityLogger.warn('Access Denied', logData);
  } else {
    securityLogger.info('Access Granted', logData);
  }
};

/**
 * Log data access (PDPA compliance)
 */
securityLogger.logDataAccess = (userId, dataType, recordId, action, metadata = {}) => {
  securityLogger.info('Data Access', {
    userId,
    dataType,
    recordId,
    action,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Log security incidents
 */
securityLogger.logIncident = (type, severity, description, metadata = {}) => {
  securityLogger.error('Security Incident', {
    type,
    severity,
    description,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

module.exports = securityLogger;
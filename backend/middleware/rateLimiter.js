const rateLimit = require('express-rate-limit');
const securityLogger = require('../utils/securityLogger');

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('API rate limit exceeded', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Authentication Rate Limiter
 * Stricter limit for login/register endpoints
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    securityLogger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      endpoint: req.originalUrl,
      userAgent: req.headers['user-agent']
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, account temporarily locked',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * File Upload Rate Limiter
 * 20 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    securityLogger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl
    });

    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later',
      retryAfter: '1 hour',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Password Reset Rate Limiter
 * 3 attempts per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    retryAfter: '1 hour'
  }
});

/**
 * OTP/Verification Rate Limiter
 * 5 attempts per 30 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later',
    retryAfter: '30 minutes'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter,
  otpLimiter
};
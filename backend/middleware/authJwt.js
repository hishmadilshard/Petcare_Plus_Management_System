const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const securityLogger = require('../utils/securityLogger');
const { unauthorized } = require('../utils/responseHandler');

/**
 * Authenticate JWT token from request header
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      securityLogger.warn('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.originalUrl
      });
      
      return unauthorized(res, 'Access token required');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // Log successful authentication
    securityLogger.logAuth('Token Authenticated', decoded.id, true, {
      ip: req.ip,
      endpoint: req.originalUrl
    });

    next();
    
  } catch (error) {
    securityLogger.logAuth('Token Authentication Failed', null, false, {
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl
    });

    if (error.message === 'Access token expired') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    return unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
    
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
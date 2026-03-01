const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    );

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Named exports for routes that destructure { authenticate, authorize }
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    );
    req.user = { id: decoded.user_id || decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;
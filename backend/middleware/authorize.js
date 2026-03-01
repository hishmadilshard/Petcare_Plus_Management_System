// authorize.js
const PERMISSIONS = require('../../permissions'); // adjust path

// middleware: require one or more permission keys
function requirePermission(...required) {
  return (req, res, next) => {
    const user = req.user; // assume user was set by auth middleware (JWT)
    if (!user || !user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const role = user.role;
    const allowed = PERMISSIONS[role] || [];

    const ok = required.every(r => allowed.includes(r));
    if (!ok) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  requirePermission
};
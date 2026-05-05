// SMART ECCD – Role-Based Access Control Middleware

/**
 * Permission map per role.
 * '*' means full access to everything.
 */
const PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  CENTER_MANAGER: [
    'center:read', 'center:write',
    'class:read',  'class:write',
    'child:read',  'child:write',
    'user:read',   'user:write',
    'report:read', 'report:write',
    'attendance:read',
    'performance:read',
    'message:read', 'message:write',
    'announcement:write',
    'notification:read', 'notification:write',
    'fee:read',    'fee:write',
    'leave:read',  'leave:write',
    'calendar:read', 'calendar:write',
    // activity:read only — activity creation/assignment is Teacher's domain
    'activity:read',
  ],
  TEACHER: [
    // Full activity ownership: create, edit, assign, conduct, record
    'activity:write', 'activity:conduct', 'activity:read',
    'attendance:write', 'attendance:read:own-class',
    'performance:write', 'performance:read:own-class',
    'child:read:own-class',
    'class:read:own',
    'message:read', 'message:write',
    'notification:read',
    'leave:read', 'leave:write',
    'calendar:read',
    'report:read',
  ],
  PARENT: [
    'performance:read:own-child',
    'attendance:read:own-child',
    'child:read:own-child',
    'message:read', 'message:write',
    'notification:read',
    'leave:read', 'leave:write',
    'fee:read',
    'calendar:read',
    'report:read',
  ],
};

/**
 * Middleware factory — checks if req.user has a given permission.
 * Must be used AFTER authenticate middleware.
 *
 * @param {string} permission - e.g. 'activity:write'
 */
const authorize = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  const userPermissions = PERMISSIONS[req.user.role] || [];

  if (userPermissions.includes('*') || userPermissions.includes(permission)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied. Required permission: ${permission}`,
  });
};

/**
 * Middleware factory — restricts access to specific roles.
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  if (roles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `Access denied. Required role: ${roles.join(' or ')}`,
  });
};

module.exports = { authorize, requireRole, PERMISSIONS };

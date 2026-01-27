/**
 * Authentication & Authorization Middleware
 * Protects routes and enforces role-based access control
 */

const authService = require('../services/authService');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Protect routes - Requires authentication
 * Verifies JWT token and attaches user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check for token in cookies (for web clients)
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  if (!token) {
    throw new AppError(
      'You are not logged in. Please login to access this resource.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
  
  try {
    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError(
        'The user belonging to this token no longer exists.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new AppError(
        'Your account has been deactivated. Please contact support.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AppError(
        'Your password was recently changed. Please login again.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.message === 'Access token expired') {
      throw new AppError(
        'Your session has expired. Please login again.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    throw new AppError(
      error.message || 'Invalid token. Please login again.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
});

/**
 * Optional authentication - Attaches user if token present, but doesn't require it
 * Useful for routes that show different content to logged-in users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = authService.verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Token invalid - continue without user
  }
  
  next();
});

/**
 * Role-based authorization
 * Restricts access to specified roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          'You are not logged in. Please login to access this resource.',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }
    
    next();
  };
};

/**
 * Require email verification
 * Blocks access for unverified users
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError(
        'You are not logged in. Please login to access this resource.',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }
  
  if (!req.user.isVerified) {
    return next(
      new AppError(
        'Please verify your email address to access this resource.',
        HTTP_STATUS.FORBIDDEN
      )
    );
  }
  
  next();
};

/**
 * Rate limiting for authentication endpoints
 * Prevents brute force attacks
 */
const authRateLimiter = (() => {
  const attempts = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      }
    }
  }, 60 * 1000); // Clean every minute
  
  return (req, res, next) => {
    const key = req.ip + ':' + (req.body.email || 'unknown');
    const now = Date.now();
    
    let data = attempts.get(key);
    
    if (!data) {
      data = { count: 0, firstAttempt: now };
      attempts.set(key, data);
    }
    
    // Reset if window has passed
    if (now - data.firstAttempt > WINDOW_MS) {
      data = { count: 0, firstAttempt: now };
      attempts.set(key, data);
    }
    
    data.count++;
    
    if (data.count > MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - data.firstAttempt)) / 1000);
      res.set('Retry-After', retryAfter);
      
      return next(
        new AppError(
          `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          HTTP_STATUS.TOO_MANY_REQUESTS || 429
        )
      );
    }
    
    // Reset on successful auth (called manually)
    req.resetRateLimit = () => {
      attempts.delete(key);
    };
    
    next();
  };
})();

/**
 * Check resource ownership
 * Allows access if user owns the resource or is admin
 * @param {string} resourceField - Field name containing owner ID
 */
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    // Admins can access everything
    if (['admin', 'superadmin'].includes(req.user.role)) {
      return next();
    }
    
    const resourceOwnerId = req.resource?.[resourceField] || req.params[resourceField];
    
    if (!resourceOwnerId) {
      return next();
    }
    
    if (resourceOwnerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          'You do not have permission to access this resource.',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }
    
    next();
  };
};

/**
 * Department-based access control
 * Restricts officers to their assigned department
 */
const departmentAccess = (req, res, next) => {
  // Admins can access everything
  if (['admin', 'superadmin'].includes(req.user.role)) {
    return next();
  }
  
  // Officers and supervisors can only see their department
  if (['officer', 'supervisor'].includes(req.user.role)) {
    if (!req.user.department) {
      return next(
        new AppError(
          'No department assigned. Please contact administrator.',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }
    
    // Add department filter to query
    req.departmentFilter = { department: req.user.department };
  }
  
  next();
};

/**
 * Log authentication events
 */
const auditAuth = (action) => {
  return (req, res, next) => {
    const originalEnd = res.end;
    
    res.end = function(...args) {
      // Log auth event
      console.log(`[AUTH] ${action}`, {
        userId: req.user?._id,
        email: req.body?.email || req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
      });
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  citizen: 0,
  officer: 1,
  supervisor: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Check if user has minimum role level
 * @param {string} minRole - Minimum required role
 */
const minRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          'You are not logged in. Please login to access this resource.',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }
    
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    
    if (userLevel < requiredLevel) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }
    
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requireVerified,
  authRateLimiter,
  checkOwnership,
  departmentAccess,
  auditAuth,
  minRole,
  ROLE_HIERARCHY,
};

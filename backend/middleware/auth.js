const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({ 
        success: false, 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again in 5 minutes.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Role-based access control middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorizeRoles('admin');

// Doctor only middleware
const doctorOnly = authorizeRoles('doctor');

// Patient only middleware
const patientOnly = authorizeRoles('patient');

// Admin or Doctor middleware
const adminOrDoctor = authorizeRoles('admin', 'doctor');

// Check if user is logged in (for public routes that need user info)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && !user.isAccountLocked()) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Rate limiting for login attempts
const loginAttemptLimiter = (req, res, next) => {
  const { email } = req.body;
  
  // This would typically be implemented with Redis or a similar store
  // For now, we'll handle this in the login route itself
  next();
};

// Session validation middleware
const validateSession = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired. Please login again.' 
    });
  }

  // Check if user's email is verified (optional requirement)
  if (req.user.role === 'patient' && !req.user.isEmailVerified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Please verify your email address before accessing this feature.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  doctorOnly,
  patientOnly,
  adminOrDoctor,
  optionalAuth,
  loginAttemptLimiter,
  validateSession
}; 
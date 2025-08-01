const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Session-based authentication middleware
const sessionAuth = async (req, res, next) => {
  try {
    // First, try to get user from session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // If session doesn't work, try JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          req.user = user;
          // Store user in session for future requests
          req.session.userId = user._id;
          return next();
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
      }
    }

    // If neither session nor JWT works, user is not authenticated
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  } catch (error) {
    console.error('Session auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional session auth (doesn't fail if not authenticated)
const optionalSessionAuth = async (req, res, next) => {
  try {
    // First, try to get user from session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // If session doesn't work, try JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          req.user = user;
          // Store user in session for future requests
          req.session.userId = user._id;
          return next();
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
      }
    }

    // If neither works, continue without user (for optional auth)
    req.user = null;
    next();
  } catch (error) {
    console.error('Optional session auth error:', error);
    req.user = null;
    next();
  }
};

// Logout middleware
const logout = (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
  });
  
  // Clear session cookie
  res.clearCookie('hospital-session');
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  sessionAuth,
  optionalSessionAuth,
  logout
}; 
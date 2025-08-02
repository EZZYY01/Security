const { body, validationResult } = require('express-validator');

// Password validation rules
const passwordValidation = [
  body('password')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be between 8 and 16 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
    .custom((value, { req }) => {
      // Check if password is same as email
      if (req.body.email && value.toLowerCase() === req.body.email.toLowerCase()) {
        throw new Error('Password cannot be the same as your email address');
      }
      return true;
    })
];

// Email validation
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
];

// Name validation
const nameValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
];

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  input = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and content
  input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous characters
  input = input.replace(/[<>]/g, '');
  
  return input.trim();
};

// Validate and sanitize request body
const validateAndSanitize = (req, res, next) => {
  // Sanitize all string inputs
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeInput(req.body[key]);
    }
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Check if password meets complexity requirements
const isPasswordComplex = (password, email = '') => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const isLongEnough = password.length >= 8;
  const isNotTooLong = password.length <= 16;
  const isNotSameAsEmail = email ? password.toLowerCase() !== email.toLowerCase() : true;

  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough && isNotTooLong && isNotSameAsEmail;
};

// Phone number validation
const phoneValidation = [
  body('phoneNumber')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number')
];

// Address validation
const addressValidation = [
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('address.zipCode')
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please enter a valid ZIP code'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
];

module.exports = {
  passwordValidation,
  emailValidation,
  nameValidation,
  phoneValidation,
  addressValidation,
  sanitizeInput,
  validateAndSanitize,
  isPasswordComplex
}; 
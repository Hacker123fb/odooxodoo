import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameters for registering new users with OTP
 */
export const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 3 })
    .withMessage('Full name must be at least 3 characters long.'),

  body('employeeCode')
    .trim()
    .notEmpty()
    .withMessage('Employee Code is required.')
    .matches(/^[A-Za-z0-9#\-_ ]+$/)
    .withMessage('Employee Code can contain letters, numbers, spaces, and #-_.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required.')
    .isLength({ min: 10, max: 15 })
    .withMessage('Mobile number must be between 10 and 15 digits long.'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Role selection is required.')
    .isIn(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'])
    .withMessage('Invalid role classification specified.'),

  validate
];

/**
 * Validates request parameters for OTP verification
 */
export const validateVerifyOtp = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required.')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be exactly 6 numeric digits.'),

  validate
];

/**
 * Validates request parameters for resending OTP
 */
export const validateResendOtp = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  validate
];

/**
 * Validates request parameters for logging in
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.'),

  validate
];

/**
 * Validates request parameters for forgot password OTP dispatch
 */
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  validate
];

/**
 * Validates request parameters for resetting password with OTP
 */
export const validateResetPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required.')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be exactly 6 numeric digits.'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{}|;:',.<>/?]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),

  validate
];

export default { 
  validateRegister, 
  validateVerifyOtp, 
  validateResendOtp, 
  validateLogin,
  validateForgotPassword,
  validateResetPassword
};

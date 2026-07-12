import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameters for registering new users
 */
export const validateRegister = [
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
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.'),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please supply a valid phone number.'),
  
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Role selection is required.')
    .isIn(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'])
    .withMessage('Invalid role classification specified.'),

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

export default { validateRegister, validateLogin };

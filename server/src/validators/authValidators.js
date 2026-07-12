import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameters for registering new users
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please supply a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please supply a valid phone number'),
  
  body('roleName')
    .isIn(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'])
    .withMessage('Invalid role classification specified'),

  validate
];

/**
 * Validates request parameters for logging in
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please supply a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate
];

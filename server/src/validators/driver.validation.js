import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameter entries for registering or updating drivers
 */
export const validateDriver = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full Name is required.')
    .isLength({ min: 3 })
    .withMessage('Full Name must be at least 3 characters.'),
  
  body('employee_id')
    .trim()
    .notEmpty()
    .withMessage('Employee Code is required.')
    .isAlphanumeric()
    .withMessage('Employee Code must be alphanumeric.'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Email must be a valid email format.')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required.')
    .isNumeric()
    .withMessage('Mobile number must contain numeric digits only.')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must contain exactly 10 digits.'),
  
  body('license_number')
    .trim()
    .notEmpty()
    .withMessage('License number is required.'),
  
  body('license_expiry')
    .notEmpty()
    .withMessage('License expiry date is required.')
    .isISO8601()
    .withMessage('License expiry date must be a valid date.')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate > today;
    })
    .withMessage('License expiry date must be a future date.'),
  
  body('license_class')
    .trim()
    .notEmpty()
    .withMessage('License Category is required.'),
  
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['Available', 'On Trip', 'Off Duty', 'Suspended'])
    .withMessage('Status must be one of: Available, On Trip, Off Duty, or Suspended.'),
  
  body('safety_score')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('Safety Score must be between 0 and 100.'),

  body('user_notes')
    .optional({ nullable: true, checkFalsy: true }),

  validate
];

export default { validateDriver };

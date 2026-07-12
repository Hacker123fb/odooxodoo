import { param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates that the request path parameter ':id' is a positive integer
 */
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  validate
];

/**
 * Validates optional page and limit query parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  validate
];

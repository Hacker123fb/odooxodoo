import { param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';
import { decodeId } from '../utils/idCodec.js';

/**
 * Validates that the request path parameter ':id' is a valid alphanumeric identifier or positive integer
 */
export const validateId = [
  param('id')
    .custom((val) => {
      const decoded = decodeId(val);
      if (!decoded || decoded <= 0) {
        throw new Error('ID must be a valid alphanumeric identifier or positive integer');
      }
      return true;
    }),
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

export default {
  validateId,
  validatePagination
};

import { validationResult } from 'express-validator';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

/**
 * Reusable express-validator runner middleware.
 * Standardizes validation responses to HTTP 400 and maps structured validation arrays
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return error fields mapped exactly to { field, message }
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return next(
      new AppError(
        'Validation failed.',
        HttpStatusCodes.BAD_REQUEST,
        formattedErrors
      )
    );
  }
  next();
};

export default validate;

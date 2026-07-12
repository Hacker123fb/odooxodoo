import { validationResult } from 'express-validator';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { Constants } from '../utils/constants.js';

/**
 * Reusable express-validator runner middleware.
 * If validation fails, formats the errors and forwards an AppError to the global handler.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value || '',
      location: err.location || ''
    }));

    return next(
      new AppError(
        Constants.MESSAGES.VALIDATION_ERROR,
        HttpStatusCodes.BAD_REQUEST,
        formattedErrors
      )
    );
  }
  next();
};

export default validate;

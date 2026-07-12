import { env } from '../config/env.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { Constants } from '../utils/constants.js';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR;
  err.message = err.message || Constants.MESSAGES.SERVER_ERROR;

  // Log non-operational errors for debugging
  if (!err.isOperational) {
    console.error('[ERROR] Unexpected System Error:', err);
  }

  // Development environment: verbose output
  if (env.nodeEnv === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
      stack: err.stack,
      error: err
    });
  }

  // Production environment: clean and secure output
  // 1. AppError (operational errors like validation or resource missing)
  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode);
  }

  // 2. MySQL specific driver errors
  if (err.code && err.code.startsWith('ER_')) {
    return ApiResponse.error(res, 'Database operation failed', null, HttpStatusCodes.BAD_REQUEST);
  }

  // 3. Generic unhandled error fallback
  return ApiResponse.error(
    res,
    Constants.MESSAGES.SERVER_ERROR,
    null,
    HttpStatusCodes.INTERNAL_SERVER_ERROR
  );
};

export default errorHandler;

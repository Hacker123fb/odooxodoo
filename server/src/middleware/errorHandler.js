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

  // 2. Database connection and network errors
  const isDbNetworkError = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'HANDSHAKE_SSL_ERROR'].includes(err.code);
  if (isDbNetworkError) {
    console.error(`[DATABASE] Service unreachable (${err.code}):`, err.message);
    return ApiResponse.error(
      res,
      'Database service is currently unreachable. Please check database connectivity.',
      null,
      HttpStatusCodes.SERVICE_UNAVAILABLE
    );
  }

  // 3. PostgreSQL specific driver errors
  if (err.code === '23505') {
    return ApiResponse.error(res, 'A record with this unique information already exists.', null, HttpStatusCodes.CONFLICT);
  }

  if (err.code === '23503') {
    return ApiResponse.error(res, 'Cannot complete operation due to referenced records.', null, HttpStatusCodes.BAD_REQUEST);
  }

  // 4. Generic unhandled error fallback
  return ApiResponse.error(
    res,
    err.message || Constants.MESSAGES.SERVER_ERROR,
    null,
    HttpStatusCodes.INTERNAL_SERVER_ERROR
  );
};

export default errorHandler;

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Middleware to verify that the request includes a valid Bearer JWT.
 * Attaches the authenticated user details to `req.user`.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Read Bearer token from headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'Authentication required. Please sign in to access this resource.',
        HttpStatusCodes.UNAUTHORIZED
      )
    );
  }

  // 2. Decode and verify JWT
  let decodedPayload;
  try {
    decodedPayload = jwt.verify(token, env.jwt.secret);
  } catch (err) {
    return next(
      new AppError(
        'Your session token is invalid or expired. Please sign in again.',
        HttpStatusCodes.UNAUTHORIZED
      )
    );
  }

  // 3. Verify user exists in the database
  const user = await userModel.findById(decodedPayload.id);
  if (!user) {
    return next(
      new AppError(
        'The account linked to this token no longer exists.',
        HttpStatusCodes.UNAUTHORIZED
      )
    );
  }

  // 4. Verify account status
  if (user.status !== 'ACTIVE') {
    return next(
      new AppError(
        `Access denied. Your account status is currently ${user.status}.`,
        HttpStatusCodes.FORBIDDEN
      )
    );
  }

  // 5. Store user details on request context
  req.user = user;
  next();
});

/**
 * Higher-order middleware to restrict access to allowed roles
 * @param {...string} roles Allowed roles names (e.g. 'SUPER_ADMIN', 'FLEET_MANAGER')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role_name)) {
      return next(
        new AppError(
          'Access forbidden. You do not have the required permissions.',
          HttpStatusCodes.FORBIDDEN
        )
      );
    }
    next();
  };
};

export default { protect, restrictTo };

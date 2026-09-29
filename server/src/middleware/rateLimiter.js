import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { getClientIp } from './ipBlocker.js';

/**
 * Standardized rate limit rejection handler
 */
const rateLimitHandler = (message) => (req, res, next, options) => {
  return ApiResponse.error(
    res,
    message || 'Too many requests. Please slow down and try again later.',
    null,
    HttpStatusCodes.TOO_MANY_REQUESTS
  );
};

/**
 * Global API rate limiter to protect against denial-of-service (DoS)
 * 3000 requests per 15 minutes per true client IP (generous for active fleet dashboard SPAs)
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many requests from this IP. Please try again after a few minutes.')
});

/**
 * Login rate limiter to prevent brute-force credential stuffing
 * 10 attempts per 15 minutes per true client IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts against the limit
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many failed login attempts. Please wait 15 minutes before trying again.')
});

/**
 * OTP Request rate limiter (registration, resend, forgot-password)
 * 5 requests per 5 minutes per true client IP
 */
export const otpRequestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many verification code requests. Please wait 5 minutes before requesting another OTP.')
});

/**
 * OTP Verification rate limiter (verify registration OTP, reset password)
 * 10 attempts per 10 minutes per true client IP
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many verification attempts. Please wait 10 minutes before trying again.')
});

import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { getClientIp, blockIpProgressive, getBlockDetails } from './ipBlocker.js';

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
 * Strict Login rate limiter to prevent brute-force credential stuffing
 * Exceeding this immediately triggers progressive IP blocking
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts against the limit
  keyGenerator: (req) => getClientIp(req),
  handler: (req, res, next, options) => {
    const clientIp = getClientIp(req);
    blockIpProgressive(clientIp, 'EXCESSIVE_LOGIN_ATTEMPTS');
    const details = getBlockDetails(clientIp);
    const mins = details ? details.remainingMinutes : 15;
    const remainingSeconds = details ? details.remainingSeconds : mins * 60;
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      success: false,
      blocked: true,
      message: `You have tried too many times. Your IP is blocked for ${details?.formattedDuration || `${mins} min`}. Please try again later.`,
      code: 'IP_BLOCKED',
      reason: 'EXCESSIVE_LOGIN_ATTEMPTS',
      remainingMinutes: mins,
      remainingSeconds,
      blockedUntil: details?.blockedUntil || (Date.now() + mins * 60 * 1000),
      tier: details?.tier || 1
    });
  }
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

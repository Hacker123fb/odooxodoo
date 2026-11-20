import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { getClientIp, blockIpProgressive, getBlockDetails } from './ipBlocker.js';

/**
 * Standardized rate limit rejection handler with fast 429 response
 */
const rateLimitHandler = (message) => (req, res, next, options) => {
  const retrySecs = options?.windowMs ? Math.ceil(options.windowMs / 1000) : 60;
  return res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: message || 'Too many requests. Please slow down and try again later.',
    retryAfter: retrySecs
  });
};

/**
 * Global API rate limiter to protect against denial-of-service (DoS)
 * 1500 requests per 15 minutes per true client IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many requests from this IP. Please try again after a few minutes.')
});

/**
 * Rapid Mutation Limiter for state-modifying requests (POST, PUT, PATCH, DELETE)
 * 120 writes per minute per true client IP
 */
export const apiMutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many write submissions. Please wait a moment before sending more data.')
});

/**
 * Query & Read Limiter for queries, searches, and lookups
 * 240 requests per minute per true client IP
 */
export const apiQueryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: rateLimitHandler('Too many search and read queries. Please slow down and try again shortly.')
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

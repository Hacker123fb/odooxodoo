import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { 
  validateRegister, 
  validateVerifyOtp, 
  validateResendOtp, 
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { 
  loginLimiter, 
  otpRequestLimiter, 
  otpVerifyLimiter 
} from '../middleware/rateLimiter.js';
import { isIpBlocked, getBlockDetails } from '../middleware/ipBlocker.js';
import { generateCsrfToken } from '../middleware/csrfProtection.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Validate user fields and send OTP to mail (Rate limited: 3 / 5m)
 */
router.post('/register', otpRequestLimiter, validateRegister, asyncHandler(authController.register));

/**
 * @route POST /api/v1/auth/verify-otp
 * @desc Verify OTP code and provision the user account (Rate limited: 5 / 10m)
 */
router.post('/verify-otp', otpVerifyLimiter, validateVerifyOtp, asyncHandler(authController.verifyOtp));

/**
 * @route POST /api/v1/auth/resend-otp
 * @desc Invalidate previous OTP and dispatch a new one (Rate limited: 3 / 5m)
 */
router.post('/resend-otp', otpRequestLimiter, validateResendOtp, asyncHandler(authController.resendOtp));

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Dispatch 6-digit OTP code to email for password recovery (Rate limited: 3 / 5m)
 */
router.post('/forgot-password', otpRequestLimiter, validateForgotPassword, asyncHandler(authController.forgotPassword));

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Verify OTP and update user password (Rate limited: 5 / 10m)
 */
router.post('/reset-password', otpVerifyLimiter, validateResetPassword, asyncHandler(authController.resetPassword));

/**
 * @route POST /api/v1/auth/login
 * @desc Log into the portal and issue a JWT (Rate limited: 5 failed attempts / 15m)
 */
router.post('/login', loginLimiter, validateLogin, asyncHandler(authController.login));

/**
 * @route GET /api/v1/auth/ip-status
 * @desc Check if caller IP is currently blocked/locked out
 */
router.get('/ip-status', (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  if (isIpBlocked(clientIp)) {
    const details = getBlockDetails(clientIp);
    return res.status(200).json({
      success: true,
      blocked: true,
      reason: details?.reason || 'BRUTE_FORCE_PREVENTION',
      remainingMinutes: details?.remainingMinutes || 15,
      remainingSeconds: details?.remainingSeconds || 900,
      blockedUntil: details?.blockedUntil || (Date.now() + 15 * 60 * 1000),
      tier: details?.tier || 1,
      formattedDuration: details?.formattedDuration || '15 minute(s)'
    });
  }

  return res.status(200).json({
    success: true,
    blocked: false
  });
});

/**
 * @route GET /api/v1/auth/csrf-token
 * @desc Generate an HMAC-signed CSRF protection token
 */
router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken();
  return res.status(200).json({
    success: true,
    csrfToken: token
  });
});

/**
 * @route GET /api/v1/auth/me
 * @desc Verify session and return active user profile
 */
router.get('/me', protect, asyncHandler(authController.getMe));

/**
 * @route DELETE /api/v1/auth/delete-account
 * @desc Permanently delete user account and associated personal data
 */
router.delete('/delete-account', protect, asyncHandler(authController.deleteAccount));

export default router;

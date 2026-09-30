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
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { 
  loginLimiter, 
  otpRequestLimiter, 
  otpVerifyLimiter 
} from '../middleware/rateLimiter.js';
import { isIpBlocked, getBlockDetails, getClientIp, unblockIp, unlockAccount } from '../middleware/ipBlocker.js';
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
  const clientIp = getClientIp(req);
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
 * @route POST /api/v1/auth/unblock
 * @desc Reset lockout cooldown for caller IP and optionally specified email
 */
router.post('/unblock', (req, res) => {
  const clientIp = getClientIp(req);
  unblockIp(clientIp, true);
  if (req.body?.email) {
    unlockAccount(req.body.email, true);
  }
  return res.status(200).json({
    success: true,
    message: 'Cooldown and lockout cleared successfully.'
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

/**
 * @route POST /api/v1/auth/verify-security-signature
 * @desc Verify cryptographic backend signature on security tasks
 */
router.post('/verify-security-signature', asyncHandler(authController.verifySecuritySignature));

/**
 * @route GET /api/v1/auth/pending-approvals
 * @desc Get all pending user registrations (SUPER_ADMIN and FLEET_MANAGER only)
 */
router.get(
  '/pending-approvals',
  protect,
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  asyncHandler(authController.getPendingApprovals)
);

/**
 * @route PATCH /api/v1/auth/pending-approvals/:id/approve
 * @desc Approve a pending staff registration (SUPER_ADMIN and FLEET_MANAGER only)
 */
router.patch(
  '/pending-approvals/:id/approve',
  protect,
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  asyncHandler(authController.approveUser)
);

/**
 * @route PATCH /api/v1/auth/pending-approvals/:id/reject
 * @desc Reject a pending staff registration (SUPER_ADMIN and FLEET_MANAGER only)
 */
router.patch(
  '/pending-approvals/:id/reject',
  protect,
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  asyncHandler(authController.rejectUser)
);

export default router;

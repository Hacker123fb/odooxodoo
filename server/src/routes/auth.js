import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { 
  validateRegister, 
  validateVerifyOtp, 
  validateResendOtp, 
  validateLogin 
} from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Validate user fields and send OTP to mail
 */
router.post('/register', validateRegister, asyncHandler(authController.register));

/**
 * @route POST /api/v1/auth/verify-otp
 * @desc Verify OTP code and provision the user account
 */
router.post('/verify-otp', validateVerifyOtp, asyncHandler(authController.verifyOtp));

/**
 * @route POST /api/v1/auth/resend-otp
 * @desc Invalidate previous OTP and dispatch a new one
 */
router.post('/resend-otp', validateResendOtp, asyncHandler(authController.resendOtp));

/**
 * @route POST /api/v1/auth/login
 * @desc Log into the portal and issue a JWT
 */
router.post('/login', validateLogin, asyncHandler(authController.login));

/**
 * @route GET /api/v1/auth/me
 * @desc Verify session and return active user profile
 */
router.get('/me', protect, asyncHandler(authController.getMe));

export default router;

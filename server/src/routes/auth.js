import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Create a new user account
 */
router.post('/register', validateRegister, asyncHandler(authController.register));

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

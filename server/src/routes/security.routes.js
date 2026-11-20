import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import securityController from '../controllers/security.controller.js';

const router = Router();

// Strict security: all endpoints require Super Admin privileges
router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

/**
 * IP Access Revocation & Restoration
 */
router.post('/revoke-ip', securityController.revokeIp);
router.post('/unblock-ip', securityController.restoreIp);
router.get('/blocked-ips', securityController.getBlockedIps);

/**
 * Affected Account Safety Lockdown & Unlock
 */
router.post('/lock-account', securityController.lockAccount);
router.post('/unlock-account', securityController.unlockAccount);
router.get('/locked-accounts', securityController.getLockedAccounts);

export default router;

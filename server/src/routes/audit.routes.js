import { Router } from 'express';
import auditController from '../controllers/audit.controller.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all audit endpoints and restrict to SUPER_ADMIN
router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

/**
 * GET /api/v1/admin/audit-logs
 * List all activity and authentication logs with filters
 */
router.get('/', auditController.getLogs);

/**
 * GET /api/v1/admin/audit-logs/stats
 * Overview analytics of security and operations events
 */
router.get('/stats', auditController.getStats);

/**
 * GET /api/v1/admin/audit-logs/download
 * Download raw log file
 */
router.get('/download', auditController.downloadLogs);

export default router;

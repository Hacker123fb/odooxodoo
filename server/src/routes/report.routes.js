import { Router } from 'express';
import reportController from '../controllers/report.controller.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all reports endpoints with financial intelligence clearance
router.use(protect);
router.use(restrictTo('SUPER_ADMIN', 'FINANCIAL_ANALYST'));

/**
 * GET /api/v1/reports
 * Returns analytical metrics table for the requested report configuration.
 */
router.get('/', reportController.getReport);

export default router;

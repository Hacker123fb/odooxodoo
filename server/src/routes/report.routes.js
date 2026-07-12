import { Router } from 'express';
import reportController from '../controllers/report.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all reports endpoints
router.use(protect);

/**
 * GET /api/v1/reports
 * Returns analytical metrics table for the requested report configuration.
 */
router.get('/', reportController.getReport);

export default router;

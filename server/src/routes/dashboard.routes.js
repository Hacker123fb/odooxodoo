import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

/**
 * GET /api/v1/dashboard
 * Aggregated KPIs, charts, and recent activities for all authenticated roles.
 */
router.get('/', dashboardController.getDashboard);

export default router;

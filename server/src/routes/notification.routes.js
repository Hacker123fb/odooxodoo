import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Require login for all notifications endpoints
router.use(protect);

/**
 * GET /api/v1/notifications
 * Lists all active alerts.
 */
router.get('/', notificationController.getNotifications);

/**
 * PUT /api/v1/notifications/read-all
 * Bulk mark all alerts as read.
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * PUT /api/v1/notifications/:id/read
 * Mark a single alert as read.
 */
router.put('/:id/read', notificationController.markAsRead);

export default router;

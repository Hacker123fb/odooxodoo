import notificationService from '../services/notification.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const notificationController = {
  /**
   * GET /api/v1/notifications
   * Returns list of alerts.
   */
  getNotifications: asyncHandler(async (req, res) => {
    const data = await notificationService.findAll();
    return res.ok(data, 'Notifications retrieved successfully.');
  }),

  /**
   * PUT /api/v1/notifications/:id/read
   * Marks a notification as read.
   */
  markAsRead: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await notificationService.markAsRead(parseInt(id, 10));
    return res.ok(null, 'Notification marked as read.');
  }),

  /**
   * PUT /api/v1/notifications/read-all
   * Marks all notifications as read.
   */
  markAllAsRead: asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead();
    return res.ok(null, 'All notifications marked as read.');
  })
};

export default notificationController;

import dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const dashboardController = {
  /**
   * GET /api/v1/dashboard
   * Returns aggregated fleet KPIs, charts, and recent activity feed.
   */
  getDashboard: asyncHandler(async (req, res) => {
    const data = await dashboardService.getDashboardData();
    return res.ok(data, 'Dashboard data retrieved successfully.');
  })
};

export default dashboardController;

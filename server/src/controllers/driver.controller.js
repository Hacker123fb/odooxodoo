import driverService from '../services/driver.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const driverController = {
  /**
   * GET /api/v1/drivers
   * List drivers matching filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '' } = req.query;
    const drivers = await driverService.getDrivers({ search, status });
    return res.ok(drivers, 'Drivers retrieved successfully.');
  }),

  /**
   * GET /api/v1/drivers/:id
   * Fetch single driver profile
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const driver = await driverService.getDriverById(id);
    return res.ok(driver, 'Driver details retrieved successfully.');
  }),

  /**
   * POST /api/v1/drivers
   * Create new driver profile
   */
  create: asyncHandler(async (req, res) => {
    const driver = await driverService.createDriver(req.body, req.user.id);
    return res.created(driver, 'Driver registered successfully.');
  }),

  /**
   * PUT /api/v1/drivers/:id
   * Update existing driver profile
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const driver = await driverService.updateDriver(id, req.body);
    return res.ok(driver, 'Driver profile updated successfully.');
  }),

  /**
   * DELETE /api/v1/drivers/:id
   * Remove a driver from roster
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await driverService.deleteDriver(id);
    return res.ok(null, 'Driver profile deleted successfully.');
  })
};

export default driverController;

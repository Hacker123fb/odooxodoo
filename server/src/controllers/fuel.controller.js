import { fuelService } from '../services/fuel.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const fuelController = {
  /**
   * GET /api/v1/fuel
   * List all fuel logs with filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', vehicleId = '', fuelTypeId = '', startDate = '', endDate = '', paymentMethod = '' } = req.query;
    const records = await fuelService.getRecords({ search, vehicleId, fuelTypeId, startDate, endDate, paymentMethod });
    return res.ok(records, 'Fuel records retrieved successfully.');
  }),

  /**
   * GET /api/v1/fuel/:id
   * Fetch details for a single fuel log record
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await fuelService.getRecordById(id);
    return res.ok(record, 'Fuel log record retrieved successfully.');
  }),

  /**
   * POST /api/v1/fuel
   * Create a new fuel log
   */
  create: asyncHandler(async (req, res) => {
    const record = await fuelService.createRecord(req.body, req.user.id);
    return res.created(record, 'Fuel log registered successfully.');
  }),

  /**
   * PUT /api/v1/fuel/:id
   * Update details of a fuel log record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await fuelService.updateRecord(id, req.body);
    return res.ok(record, 'Fuel log updated successfully.');
  }),

  /**
   * DELETE /api/v1/fuel/:id
   * Remove a fuel log record from database
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await fuelService.deleteRecord(id);
    return res.ok(null, 'Fuel log deleted successfully.');
  }),

  /**
   * GET /api/v1/fuel/meta/options
   * Retrieves selector options (vehicles, trips, fuel types)
   */
  getMetadataOptions: asyncHandler(async (req, res) => {
    const options = await fuelService.getMetadataOptions();
    return res.ok(options, 'Selector options retrieved successfully.');
  })
};

export default fuelController;

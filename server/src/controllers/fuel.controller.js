import { fuelService } from '../services/fuel.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

export const fuelController = {
  /**
   * GET /api/v1/fuel
   * List all fuel logs with filters and pagination
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', vehicleId = '', fuelTypeId = '', startDate = '', endDate = '', paymentMethod = '', page = 1, limit = 25 } = req.query;
    const result = await fuelService.getRecords({ search, vehicleId, fuelTypeId, startDate, endDate, paymentMethod, page, limit });
    if (result && result.pagination) {
      return res.ok(result.data, 'Fuel records retrieved successfully.', result.pagination);
    }
    return res.ok(result, 'Fuel records retrieved successfully.');
  }),

  /**
   * GET /api/v1/fuel/:id
   * Fetch details for a single fuel log record with parameter validation
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      throw new AppError('Invalid fuel record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const record = await fuelService.getRecordById(numId);
    if (!record) {
      throw new AppError(`Fuel log record #${numId} was not found.`, HttpStatusCodes.NOT_FOUND);
    }
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

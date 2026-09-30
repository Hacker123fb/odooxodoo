import { maintenanceService } from '../services/maintenance.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

export const maintenanceController = {
  /**
   * GET /api/v1/maintenance
   * List all maintenance logs with filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', vehicleId = '', maintenanceType = '', startDate = '', endDate = '' } = req.query;
    const records = await maintenanceService.getRecords({ search, status, vehicleId, maintenanceType, startDate, endDate });
    return res.ok(records, 'Maintenance records retrieved successfully.');
  }),

  /**
   * GET /api/v1/maintenance/:id
   * Fetch details for a single maintenance record with parameter validation
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      throw new AppError('Invalid maintenance identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const record = await maintenanceService.getRecordById(numId);
    if (!record) {
      throw new AppError(`Maintenance record #${numId} was not found.`, HttpStatusCodes.NOT_FOUND);
    }
    return res.ok(record, 'Maintenance record retrieved successfully.');
  }),

  /**
   * POST /api/v1/maintenance
   * Create a new maintenance record
   */
  create: asyncHandler(async (req, res) => {
    const record = await maintenanceService.createRecord(req.body, req.user.id);
    return res.created(record, 'Maintenance record created successfully.');
  }),

  /**
   * PUT /api/v1/maintenance/:id
   * Update details of a maintenance record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await maintenanceService.updateRecord(id, req.body);
    return res.ok(record, 'Maintenance record updated successfully.');
  }),

  /**
   * DELETE /api/v1/maintenance/:id
   * Remove a maintenance record from database
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await maintenanceService.deleteRecord(id);
    return res.ok(null, 'Maintenance record deleted successfully.');
  })
};

export default maintenanceController;

import { maintenanceService } from '../services/maintenance.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

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
   * Fetch details for a single maintenance record
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await maintenanceService.getRecordById(id);
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

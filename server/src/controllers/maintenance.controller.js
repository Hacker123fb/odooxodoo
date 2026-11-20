import { maintenanceService } from '../services/maintenance.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const maintenanceController = {
  /**
   * GET /api/v1/maintenance
   * List all maintenance logs with filters and alphanumeric IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', vehicleId = '', maintenanceType = '', startDate = '', endDate = '', page = 1, limit = 25 } = req.query;
    const parsedVehicleId = vehicleId ? decodeId(vehicleId) : '';

    const result = await maintenanceService.getRecords({
      search,
      status,
      vehicleId: parsedVehicleId,
      maintenanceType,
      startDate,
      endDate,
      page,
      limit
    });

    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(m => ({
        ...m,
        publicId: encodeId('MNT', m.id),
        vehiclePublicId: m.vehicle_id ? encodeId('VEH', m.vehicle_id) : null
      }));
      return res.ok(dataWithPublicIds, 'Maintenance records retrieved successfully.', result.pagination);
    }

    const dataWithPublicIds = Array.isArray(result)
      ? result.map(m => ({
          ...m,
          publicId: encodeId('MNT', m.id),
          vehiclePublicId: m.vehicle_id ? encodeId('VEH', m.vehicle_id) : null
        }))
      : result;

    return res.ok(dataWithPublicIds, 'Maintenance records retrieved successfully.');
  }),

  /**
   * GET /api/v1/maintenance/:id
   * Fetch details for a single maintenance record supporting alphanumeric ID (e.g. MNT-9RE551)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid maintenance identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const record = await maintenanceService.getRecordById(numId);
    if (!record) {
      throw new AppError('Maintenance record was not found.', HttpStatusCodes.NOT_FOUND);
    }
    record.publicId = encodeId('MNT', record.id);
    if (record.vehicle_id) record.vehiclePublicId = encodeId('VEH', record.vehicle_id);
    return res.ok(record, 'Maintenance record retrieved successfully.');
  }),

  /**
   * POST /api/v1/maintenance
   * Create a new maintenance record
   */
  create: asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);

    const record = await maintenanceService.createRecord(body, req.user.id);
    if (record) {
      record.publicId = encodeId('MNT', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'CREATE_MAINTENANCE',
      status: 'SUCCESS',
      resourceType: 'maintenance',
      resourceId: record?.publicId || record?.id,
      details: {
        vehicleId: body.vehicleId,
        type: body.maintenanceType,
        cost: body.cost
      }
    });

    return res.created(record, 'Maintenance record created successfully.');
  }),

  /**
   * PUT /api/v1/maintenance/:id
   * Update details of a maintenance record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid maintenance identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }

    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);

    const record = await maintenanceService.updateRecord(numId, body);
    if (record) {
      record.publicId = encodeId('MNT', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_MAINTENANCE',
      status: 'SUCCESS',
      resourceType: 'maintenance',
      resourceId: encodeId('MNT', numId),
      details: {
        status: body.status,
        updatedFields: Object.keys(body)
      }
    });

    return res.ok(record, 'Maintenance record updated successfully.');
  }),

  /**
   * DELETE /api/v1/maintenance/:id
   * Remove a maintenance record from database
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid maintenance identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    await maintenanceService.deleteRecord(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_MAINTENANCE',
      status: 'SUCCESS',
      resourceType: 'maintenance',
      resourceId: encodeId('MNT', numId),
      details: { deletedMaintenanceId: numId }
    });

    return res.ok(null, 'Maintenance record deleted successfully.');
  })
};

export default maintenanceController;

import { fuelService } from '../services/fuel.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const fuelController = {
  /**
   * GET /api/v1/fuel
   * List all fuel logs with filters and alphanumeric IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', vehicleId = '', fuelTypeId = '', startDate = '', endDate = '', paymentMethod = '', page = 1, limit = 25 } = req.query;
    const parsedVehicleId = vehicleId ? decodeId(vehicleId) : '';

    const result = await fuelService.getRecords({
      search,
      vehicleId: parsedVehicleId,
      fuelTypeId,
      startDate,
      endDate,
      paymentMethod,
      page,
      limit
    });

    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(f => ({
        ...f,
        publicId: encodeId('FUL', f.id),
        vehiclePublicId: f.vehicle_id ? encodeId('VEH', f.vehicle_id) : null,
        tripPublicId: f.trip_id ? encodeId('TRP', f.trip_id) : null
      }));
      return res.ok(dataWithPublicIds, 'Fuel records retrieved successfully.', result.pagination);
    }

    const dataWithPublicIds = Array.isArray(result)
      ? result.map(f => ({
          ...f,
          publicId: encodeId('FUL', f.id),
          vehiclePublicId: f.vehicle_id ? encodeId('VEH', f.vehicle_id) : null,
          tripPublicId: f.trip_id ? encodeId('TRP', f.trip_id) : null
        }))
      : result;

    return res.ok(dataWithPublicIds, 'Fuel records retrieved successfully.');
  }),

  /**
   * GET /api/v1/fuel/:id
   * Fetch details for a single fuel log record supporting alphanumeric ID (e.g. FUL-LC3A5W)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid fuel record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const record = await fuelService.getRecordById(numId);
    if (!record) {
      throw new AppError('Fuel log record was not found.', HttpStatusCodes.NOT_FOUND);
    }
    record.publicId = encodeId('FUL', record.id);
    if (record.vehicle_id) record.vehiclePublicId = encodeId('VEH', record.vehicle_id);
    if (record.trip_id) record.tripPublicId = encodeId('TRP', record.trip_id);
    return res.ok(record, 'Fuel log record retrieved successfully.');
  }),

  /**
   * POST /api/v1/fuel
   * Create a new fuel log
   */
  create: asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.tripId) body.tripId = decodeId(body.tripId);

    const record = await fuelService.createRecord(body, req.user.id);
    if (record) {
      record.publicId = encodeId('FUL', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'CREATE_FUEL_LOG',
      status: 'SUCCESS',
      resourceType: 'fuel',
      resourceId: record?.publicId || record?.id,
      details: {
        vehicleId: body.vehicleId,
        quantity: body.quantityLiters,
        totalCost: body.totalCost,
        receiptNumber: body.receiptNumber
      }
    });

    return res.created(record, 'Fuel log registered successfully.');
  }),

  /**
   * PUT /api/v1/fuel/:id
   * Update details of a fuel log record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid fuel record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }

    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.tripId) body.tripId = decodeId(body.tripId);

    const record = await fuelService.updateRecord(numId, body);
    if (record) {
      record.publicId = encodeId('FUL', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_FUEL_LOG',
      status: 'SUCCESS',
      resourceType: 'fuel',
      resourceId: encodeId('FUL', numId),
      details: {
        receiptNumber: body.receiptNumber,
        updatedFields: Object.keys(body)
      }
    });

    return res.ok(record, 'Fuel log updated successfully.');
  }),

  /**
   * DELETE /api/v1/fuel/:id
   * Remove a fuel log record from database
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid fuel record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    await fuelService.deleteRecord(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_FUEL_LOG',
      status: 'SUCCESS',
      resourceType: 'fuel',
      resourceId: encodeId('FUL', numId),
      details: { deletedFuelRecordId: numId }
    });

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

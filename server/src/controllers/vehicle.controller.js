import vehicleService from '../services/vehicle.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const vehicleController = {
  /**
   * GET /api/v1/vehicles
   * List vehicles matching filters with alphanumeric IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', type = '', page, limit } = req.query;
    const result = await vehicleService.getVehicles({ search, status, type, page, limit });
    
    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(v => ({
        ...v,
        publicId: encodeId('VEH', v.id)
      }));
      return res.ok(dataWithPublicIds, 'Vehicles retrieved successfully.', result.pagination);
    }
    
    const dataWithPublicIds = Array.isArray(result)
      ? result.map(v => ({ ...v, publicId: encodeId('VEH', v.id) }))
      : result;

    return res.ok(dataWithPublicIds, 'Vehicles retrieved successfully.');
  }),

  /**
   * GET /api/v1/vehicles/:id
   * Fetch single vehicle profile supporting alphanumeric public IDs (e.g. VEH-SR1737)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid vehicle identifier.', HttpStatusCodes.BAD_REQUEST);
    }
    const vehicle = await vehicleService.getVehicleById(numId);
    if (!vehicle) {
      throw new AppError('Vehicle was not found.', HttpStatusCodes.NOT_FOUND);
    }
    vehicle.publicId = encodeId('VEH', vehicle.id);
    return res.ok(vehicle, 'Vehicle details retrieved successfully.');
  }),

  /**
   * POST /api/v1/vehicles
   * Create new vehicle
   */
  create: asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.createVehicle(req.body, req.user.id);
    if (vehicle) {
      vehicle.publicId = encodeId('VEH', vehicle.id);
    }

    auditService.logActionEvent({
      req,
      action: 'CREATE_VEHICLE',
      status: 'SUCCESS',
      resourceType: 'vehicle',
      resourceId: vehicle?.publicId || vehicle?.id,
      details: {
        registrationNumber: req.body?.registrationNumber,
        vin: req.body?.vin,
        status: req.body?.status
      }
    });

    return res.created(vehicle, 'Vehicle registered successfully.');
  }),

  /**
   * PUT /api/v1/vehicles/:id
   * Update existing vehicle
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid vehicle identifier.', HttpStatusCodes.BAD_REQUEST);
    }
    const vehicle = await vehicleService.updateVehicle(numId, req.body);
    if (vehicle) {
      vehicle.publicId = encodeId('VEH', vehicle.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_VEHICLE',
      status: 'SUCCESS',
      resourceType: 'vehicle',
      resourceId: encodeId('VEH', numId),
      details: {
        registrationNumber: vehicle?.registration_number,
        updatedFields: Object.keys(req.body)
      }
    });

    return res.ok(vehicle, 'Vehicle updated successfully.');
  }),

  /**
   * DELETE /api/v1/vehicles/:id
   * Delete vehicle from inventory
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid vehicle identifier.', HttpStatusCodes.BAD_REQUEST);
    }
    await vehicleService.deleteVehicle(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_VEHICLE',
      status: 'SUCCESS',
      resourceType: 'vehicle',
      resourceId: encodeId('VEH', numId),
      details: { deletedVehicleId: numId }
    });

    return res.ok(null, 'Vehicle deleted successfully.');
  }),

  /**
   * GET /api/v1/vehicles/meta/options
   * Fetch lists of models, fuel categories, and types for selects
   */
  getMetadataOptions: asyncHandler(async (req, res) => {
    const meta = await vehicleService.getMetadataOptions();
    return res.ok(meta, 'Metadata options retrieved successfully.');
  })
};

export default vehicleController;

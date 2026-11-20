import driverService from '../services/driver.service.js';
import { driverModel } from '../models/driver.model.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const driverController = {
  /**
   * GET /api/v1/drivers
   * List drivers matching filters with unique alphanumeric public IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', page, limit } = req.query;
    const result = await driverService.getDrivers({ search, status, page, limit });
    
    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(d => ({
        ...d,
        publicId: encodeId('DRV', d.id)
      }));
      return res.ok(dataWithPublicIds, 'Drivers retrieved successfully.', result.pagination);
    }
    
    const dataWithPublicIds = Array.isArray(result) 
      ? result.map(d => ({ ...d, publicId: encodeId('DRV', d.id) }))
      : result;

    return res.ok(dataWithPublicIds, 'Drivers retrieved successfully.');
  }),

  /**
   * GET /api/v1/drivers/:id
   * Fetch single driver profile supporting alphanumeric public IDs (e.g. DRV-LC3A5W)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid driver identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const driver = await driverService.getDriverById(numId);
    if (!driver) {
      throw new AppError(`Driver profile was not found.`, HttpStatusCodes.NOT_FOUND);
    }
    driver.publicId = encodeId('DRV', driver.id);
    return res.ok(driver, 'Driver details retrieved successfully.');
  }),

  /**
   * POST /api/v1/drivers
   * Create new driver profile
   */
  create: asyncHandler(async (req, res) => {
    const driver = await driverService.createDriver(req.body, req.user.id);
    if (driver) {
      driver.publicId = encodeId('DRV', driver.id);
    }

    auditService.logActionEvent({
      req,
      action: 'CREATE_DRIVER',
      status: 'SUCCESS',
      resourceType: 'driver',
      resourceId: driver?.publicId || encodeId('DRV', driver?.id),
      details: {
        rawId: driver?.id,
        driverName: driver?.full_name || req.body?.fullName,
        licenseNumber: req.body?.licenseNumber,
        employeeId: req.body?.employeeId,
        newState: driver
      }
    });

    return res.created(driver, 'Driver registered successfully.');
  }),

  /**
   * PUT /api/v1/drivers/:id
   * Update existing driver profile
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid driver identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const previousDriver = await driverModel.findById(numId);
    const driver = await driverService.updateDriver(numId, req.body);
    if (driver) {
      driver.publicId = encodeId('DRV', driver.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_DRIVER',
      status: 'SUCCESS',
      resourceType: 'driver',
      resourceId: encodeId('DRV', numId),
      details: {
        rawId: numId,
        driverName: driver?.full_name || req.body?.fullName,
        updatedFields: Object.keys(req.body),
        previousState: previousDriver,
        newState: driver
      }
    });

    return res.ok(driver, 'Driver profile updated successfully.');
  }),

  /**
   * DELETE /api/v1/drivers/:id
   * Remove a driver from roster
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid driver identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const previousDriver = await driverModel.findById(numId);
    await driverService.deleteDriver(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_DRIVER',
      status: 'SUCCESS',
      resourceType: 'driver',
      resourceId: encodeId('DRV', numId),
      details: {
        rawId: numId,
        deletedDriverId: numId,
        previousState: previousDriver
      }
    });

    return res.ok(null, 'Driver profile deleted successfully.');
  })
};

export default driverController;

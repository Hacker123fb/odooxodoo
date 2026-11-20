import tripService from '../services/trip.service.js';
import tripModel from '../models/trip.model.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const tripController = {
  /**
   * GET /api/v1/trips
   * List trips matching filters with alphanumeric IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', vehicleId = '', driverId = '', startDate = '', endDate = '', page, limit } = req.query;
    const parsedVehicleId = vehicleId ? decodeId(vehicleId) : '';
    const parsedDriverId = driverId ? decodeId(driverId) : '';

    const result = await tripService.getTrips({
      search,
      status,
      vehicleId: parsedVehicleId,
      driverId: parsedDriverId,
      startDate,
      endDate,
      page,
      limit
    });

    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(t => ({
        ...t,
        publicId: encodeId('TRP', t.id),
        vehiclePublicId: t.vehicle_id ? encodeId('VEH', t.vehicle_id) : null,
        driverPublicId: t.driver_id ? encodeId('DRV', t.driver_id) : null
      }));
      return res.ok(dataWithPublicIds, 'Trips retrieved successfully.', result.pagination);
    }

    const dataWithPublicIds = Array.isArray(result)
      ? result.map(t => ({
          ...t,
          publicId: encodeId('TRP', t.id),
          vehiclePublicId: t.vehicle_id ? encodeId('VEH', t.vehicle_id) : null,
          driverPublicId: t.driver_id ? encodeId('DRV', t.driver_id) : null
        }))
      : result;

    return res.ok(dataWithPublicIds, 'Trips retrieved successfully.');
  }),

  /**
   * GET /api/v1/trips/:id
   * Fetch single trip details supporting alphanumeric ID (e.g. TRP-ZVWX8Y)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid trip identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const trip = await tripService.getTripById(numId);
    if (!trip) {
      throw new AppError('Trip was not found.', HttpStatusCodes.NOT_FOUND);
    }
    trip.publicId = encodeId('TRP', trip.id);
    if (trip.vehicle_id) trip.vehiclePublicId = encodeId('VEH', trip.vehicle_id);
    if (trip.driver_id) trip.driverPublicId = encodeId('DRV', trip.driver_id);
    return res.ok(trip, 'Trip details retrieved successfully.');
  }),

  /**
   * POST /api/v1/trips
   * Register a new scheduled trip
   */
  create: asyncHandler(async (req, res) => {
    // Resolve vehicleId and driverId if passed as alphanumeric codes
    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.driverId) body.driverId = decodeId(body.driverId);

    const trip = await tripService.createTrip(body, req.user.id);
    if (trip) {
      trip.publicId = encodeId('TRP', trip.id);
    }

    auditService.logActionEvent({
      req,
      action: 'CREATE_TRIP',
      status: 'SUCCESS',
      resourceType: 'trip',
      resourceId: trip?.publicId || encodeId('TRP', trip?.id),
      details: {
        rawId: trip?.id,
        source: body.sourceLocation,
        destination: body.destinationLocation,
        vehicleId: body.vehicleId,
        driverId: body.driverId,
        newState: trip
      }
    });

    return res.created(trip, 'Trip scheduled successfully.');
  }),

  /**
   * PUT /api/v1/trips/:id
   * Update existing trip record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid trip identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }

    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.driverId) body.driverId = decodeId(body.driverId);

    const previousTrip = await tripModel.findById(numId);
    const trip = await tripService.updateTrip(numId, body);
    if (trip) {
      trip.publicId = encodeId('TRP', trip.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_TRIP',
      status: 'SUCCESS',
      resourceType: 'trip',
      resourceId: encodeId('TRP', numId),
      details: {
        rawId: numId,
        status: body.status,
        updatedFields: Object.keys(body),
        previousState: previousTrip,
        newState: trip
      }
    });

    return res.ok(trip, 'Trip updated successfully.');
  }),

  /**
   * DELETE /api/v1/trips/:id
   * Remove a trip from list
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid trip identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const previousTrip = await tripModel.findById(numId);
    await tripService.deleteTrip(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_TRIP',
      status: 'SUCCESS',
      resourceType: 'trip',
      resourceId: encodeId('TRP', numId),
      details: {
        rawId: numId,
        deletedTripId: numId,
        previousState: previousTrip
      }
    });

    return res.ok(null, 'Trip deleted successfully.');
  }),

  /**
   * GET /api/v1/trips/meta/options
   * Fetch available vehicles, available drivers, and locations lists
   */
  getMetadataOptions: asyncHandler(async (req, res) => {
    const { excludeTripId } = req.query;
    const parsedTripId = excludeTripId ? decodeId(excludeTripId) : null;
    const options = await tripService.getMetadataOptions(parsedTripId);
    return res.ok(options, 'Selector metadata options retrieved successfully.');
  })
};

export default tripController;

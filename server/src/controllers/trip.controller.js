import tripService from '../services/trip.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const tripController = {
  /**
   * GET /api/v1/trips
   * List trips matching filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', vehicleId = '', driverId = '', startDate = '', endDate = '' } = req.query;
    const trips = await tripService.getTrips({ search, status, vehicleId, driverId, startDate, endDate });
    return res.ok(trips, 'Trips retrieved successfully.');
  }),

  /**
   * GET /api/v1/trips/:id
   * Fetch single trip details
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trip = await tripService.getTripById(id);
    return res.ok(trip, 'Trip details retrieved successfully.');
  }),

  /**
   * POST /api/v1/trips
   * Register a new scheduled trip
   */
  create: asyncHandler(async (req, res) => {
    const trip = await tripService.createTrip(req.body, req.user.id);
    return res.created(trip, 'Trip scheduled successfully.');
  }),

  /**
   * PUT /api/v1/trips/:id
   * Update existing trip record (handles transit state machine)
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trip = await tripService.updateTrip(id, req.body);
    return res.ok(trip, 'Trip updated successfully.');
  }),

  /**
   * DELETE /api/v1/trips/:id
   * Remove a trip from list
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await tripService.deleteTrip(id);
    return res.ok(null, 'Trip deleted successfully.');
  }),

  /**
   * GET /api/v1/trips/meta/options
   * Fetch available vehicles, available drivers, and locations lists
   */
  getMetadataOptions: asyncHandler(async (req, res) => {
    const { excludeTripId } = req.query;
    const parsedTripId = excludeTripId ? parseInt(excludeTripId, 10) : null;
    const options = await tripService.getMetadataOptions(parsedTripId);
    return res.ok(options, 'Selector metadata options retrieved successfully.');
  })
};

export default tripController;

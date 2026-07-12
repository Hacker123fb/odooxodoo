import vehicleService from '../services/vehicle.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const vehicleController = {
  /**
   * GET /api/v1/vehicles
   * List vehicles matching filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', status = '', type = '' } = req.query;
    const vehicles = await vehicleService.getVehicles({ search, status, type });
    return res.ok(vehicles, 'Vehicles retrieved successfully.');
  }),

  /**
   * GET /api/v1/vehicles/:id
   * Fetch single vehicle profile
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await vehicleService.getVehicleById(id);
    return res.ok(vehicle, 'Vehicle details retrieved successfully.');
  }),

  /**
   * POST /api/v1/vehicles
   * Create new vehicle
   */
  create: asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.createVehicle(req.body, req.user.id);
    return res.created(vehicle, 'Vehicle registered successfully.');
  }),

  /**
   * PUT /api/v1/vehicles/:id
   * Update existing vehicle
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await vehicleService.updateVehicle(id, req.body);
    return res.ok(vehicle, 'Vehicle updated successfully.');
  }),

  /**
   * DELETE /api/v1/vehicles/:id
   * Delete vehicle from inventory
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await vehicleService.deleteVehicle(id);
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

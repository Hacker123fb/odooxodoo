import { Router } from 'express';
import vehicleController from '../controllers/vehicle.controller.js';
import { validateVehicle } from '../validators/vehicle.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this module require authentication and vehicle operations clearance
router.use(protect);
router.use(restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'));

/**
 * GET /api/v1/vehicles
 * List all vehicles with optional filters
 */
router.get('/', vehicleController.getAll);

/**
 * GET /api/v1/vehicles/meta/options
 * Retrieve selector options (makes, models, fuel types)
 */
router.get('/meta/options', vehicleController.getMetadataOptions);

/**
 * GET /api/v1/vehicles/:id
 * Retrieve details for a single vehicle
 */
router.get('/:id', vehicleController.getById);

/**
 * POST /api/v1/vehicles
 * Register a new vehicle in inventory
 */
router.post('/', validateVehicle, vehicleController.create);

/**
 * PUT /api/v1/vehicles/:id
 * Update an existing vehicle's attributes
 */
router.put('/:id', validateVehicle, vehicleController.update);

/**
 * DELETE /api/v1/vehicles/:id
 * Remove a vehicle from inventory
 */
router.delete('/:id', vehicleController.delete);

export default router;

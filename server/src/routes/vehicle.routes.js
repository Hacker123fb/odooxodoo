import { Router } from 'express';
import vehicleController from '../controllers/vehicle.controller.js';
import { validateVehicle } from '../validators/vehicle.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * GET /api/v1/vehicles
 * List all vehicles with optional filters (Accessible to all portal operational roles)
 */
router.get(
  '/', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), 
  vehicleController.getAll
);

/**
 * GET /api/v1/vehicles/meta/options
 * Retrieve selector options (makes, models, fuel types)
 */
router.get(
  '/meta/options', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), 
  vehicleController.getMetadataOptions
);

/**
 * GET /api/v1/vehicles/:id
 * Retrieve details for a single vehicle
 */
router.get(
  '/:id', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), 
  vehicleController.getById
);

/**
 * POST /api/v1/vehicles
 * Register a new vehicle in inventory (Admin & Fleet Managers only)
 */
router.post(
  '/', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'), 
  validateVehicle, 
  vehicleController.create
);

/**
 * PUT /api/v1/vehicles/:id
 * Update an existing vehicle's attributes
 */
router.put(
  '/:id', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'), 
  validateVehicle, 
  vehicleController.update
);

/**
 * DELETE /api/v1/vehicles/:id
 * Remove a vehicle from inventory
 */
router.delete(
  '/:id', 
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'), 
  vehicleController.delete
);

export default router;

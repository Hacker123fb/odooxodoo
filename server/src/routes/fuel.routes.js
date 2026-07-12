import { Router } from 'express';
import fuelController from '../controllers/fuel.controller.js';
import { validateFuel } from '../validators/fuel.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Require session validation for all endpoints in this module
router.use(protect);

/**
 * GET /api/v1/fuel
 * Retrieve list of all fuel logs with filters
 */
router.get('/', fuelController.getAll);

/**
 * GET /api/v1/fuel/meta/options
 * Retrieve selector options (vehicles, trips, fuel types)
 */
router.get('/meta/options', fuelController.getMetadataOptions);

/**
 * GET /api/v1/fuel/:id
 * Retrieve details for a single log record
 */
router.get('/:id', fuelController.getById);

/**
 * POST /api/v1/fuel
 * Create a new fuel log record
 */
router.post(
  '/',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  validateFuel,
  fuelController.create
);

/**
 * PUT /api/v1/fuel/:id
 * Update details of a fuel log record
 */
router.put(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  validateFuel,
  fuelController.update
);

/**
 * DELETE /api/v1/fuel/:id
 * Remove a fuel log record
 */
router.delete(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  fuelController.delete
);

export default router;

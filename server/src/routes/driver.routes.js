import { Router } from 'express';
import driverController from '../controllers/driver.controller.js';
import { validateDriver } from '../validators/driver.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Require session validation for all endpoints in this module
router.use(protect);

/**
 * GET /api/v1/drivers
 * Retrieve list of all operators with filters
 */
router.get('/', driverController.getAll);

/**
 * GET /api/v1/drivers/:id
 * Retrieve details for a single driver profile
 */
router.get('/:id', driverController.getById);

/**
 * POST /api/v1/drivers
 * Register a new driver profile
 */
router.post(
  '/',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  validateDriver,
  driverController.create
);

/**
 * PUT /api/v1/drivers/:id
 * Update driver details
 */
router.put(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  validateDriver,
  driverController.update
);

/**
 * DELETE /api/v1/drivers/:id
 * Remove a driver profile from inventory roster
 */
router.delete(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  driverController.delete
);

export default router;

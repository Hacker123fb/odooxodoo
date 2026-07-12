import { Router } from 'express';
import maintenanceController from '../controllers/maintenance.controller.js';
import { validateMaintenance } from '../validators/maintenance.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Require session validation for all endpoints in this module
router.use(protect);

/**
 * GET /api/v1/maintenance
 * Retrieve list of all maintenance logs with filters
 */
router.get('/', maintenanceController.getAll);

/**
 * GET /api/v1/maintenance/:id
 * Retrieve details for a single log record
 */
router.get('/:id', maintenanceController.getById);

/**
 * POST /api/v1/maintenance
 * Create a new maintenance record
 */
router.post(
  '/',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  validateMaintenance,
  maintenanceController.create
);

/**
 * PUT /api/v1/maintenance/:id
 * Update details of a maintenance record
 */
router.put(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  validateMaintenance,
  maintenanceController.update
);

/**
 * DELETE /api/v1/maintenance/:id
 * Remove a maintenance record
 */
router.delete(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER'),
  maintenanceController.delete
);

export default router;

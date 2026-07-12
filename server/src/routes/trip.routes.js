import { Router } from 'express';
import tripController from '../controllers/trip.controller.js';
import { validateTrip } from '../validators/trip.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Require session validation for all endpoints in this module
router.use(protect);

/**
 * GET /api/v1/trips
 * Retrieve list of all trips with filters
 */
router.get('/', tripController.getAll);

/**
 * GET /api/v1/trips/meta/options
 * Retrieve selector options (available vehicles, available drivers, locations)
 */
router.get('/meta/options', tripController.getMetadataOptions);

/**
 * GET /api/v1/trips/:id
 * Retrieve details for a single trip
 */
router.get('/:id', tripController.getById);

/**
 * POST /api/v1/trips
 * Schedule a new trip
 */
router.post(
  '/',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'),
  validateTrip,
  tripController.create
);

/**
 * PUT /api/v1/trips/:id
 * Update trip details (handles state changes)
 */
router.put(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'),
  validateTrip,
  tripController.update
);

/**
 * DELETE /api/v1/trips/:id
 * Remove a trip from list
 */
router.delete(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'),
  tripController.delete
);

export default router;

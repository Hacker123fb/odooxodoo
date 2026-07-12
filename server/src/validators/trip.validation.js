import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameter entries for registering or updating trips
 */
export const validateTrip = [
  body('origin_id')
    .isInt({ min: 1 })
    .withMessage('Source location is required.'),
  
  body('destination_id')
    .isInt({ min: 1 })
    .withMessage('Destination location is required.')
    .custom((value, { req }) => {
      if (parseInt(value, 10) === parseInt(req.body.origin_id, 10)) {
        throw new Error('Destination location cannot be the same as the source.');
      }
      return true;
    }),
  
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('Vehicle is required.'),
  
  body('driver_id')
    .isInt({ min: 1 })
    .withMessage('Driver is required.'),
  
  body('scheduled_departure')
    .notEmpty()
    .withMessage('Departure Date and Time are required.')
    .isISO8601()
    .withMessage('Departure must be a valid date format.')
    .custom((value, { req }) => {
      // Check only on create. For updates, we can relax past departure check if it already started.
      if (req.method === 'POST') {
        const departureDate = new Date(value);
        const now = new Date();
        // Give 5 minutes buffer for network lags
        now.setMinutes(now.getMinutes() - 5);
        if (departureDate < now) {
          throw new Error('Departure date cannot be in the past.');
        }
      }
      return true;
    }),
  
  body('scheduled_arrival')
    .notEmpty()
    .withMessage('Expected Arrival Date and Time are required.')
    .isISO8601()
    .withMessage('Expected arrival must be a valid date format.')
    .custom((value, { req }) => {
      const arrivalDate = new Date(value);
      const departureDate = new Date(req.body.scheduled_departure);
      if (arrivalDate <= departureDate) {
        throw new Error('Expected arrival must be after departure.');
      }
      return true;
    }),
  
  body('distance_km')
    .isFloat({ gt: 0 })
    .withMessage('Distance must be greater than zero.'),
  
  body('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'])
    .withMessage('Invalid status value.'),
  
  body('estimated_fuel')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Estimated fuel consumption cannot be negative.'),

  body('cargo_passenger_desc')
    .optional({ nullable: true, checkFalsy: true }),

  body('user_notes')
    .optional({ nullable: true, checkFalsy: true }),

  validate
];

export default { validateTrip };

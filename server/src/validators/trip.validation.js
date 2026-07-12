import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameter entries for registering or updating trips
 */
export const validateTrip = [
  body('sourceLocation')
    .trim()
    .notEmpty()
    .withMessage('Source Location is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Source Location must be between 2 and 100 characters.'),
  
  body('destinationLocation')
    .trim()
    .notEmpty()
    .withMessage('Destination Location is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination Location must be between 2 and 100 characters.')
    .custom((value, { req }) => {
      if (value && req.body.sourceLocation && value.toLowerCase() === req.body.sourceLocation.toLowerCase()) {
        throw new Error('Destination Location cannot be the same as the Source Location.');
      }
      return true;
    }),
  
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required.')
    .isInt({ min: 1 })
    .withMessage('Vehicle is required.'),
  
  body('driverId')
    .notEmpty()
    .withMessage('Driver is required.')
    .isInt({ min: 1 })
    .withMessage('Driver is required.'),
  
  body('departureDate')
    .notEmpty()
    .withMessage('Departure Date is required.')
    .isISO8601()
    .withMessage('Departure Date must be a valid date.')
    .custom((value, { req }) => {
      if (req.method === 'POST') {
        const departureDate = new Date(`${value}T${req.body.departureTime || '00:00'}:00`);
        const now = new Date();
        now.setMinutes(now.getMinutes() - 5); // 5 min buffer
        if (departureDate < now) {
          throw new Error('Departure Date cannot be in the past.');
        }
      }
      return true;
    }),

  body('departureTime')
    .notEmpty()
    .withMessage('Departure Time is required.')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Departure Time must be a valid time (HH:MM).'),
  
  body('expectedArrivalDate')
    .notEmpty()
    .withMessage('Expected Arrival Date is required.')
    .isISO8601()
    .withMessage('Expected Arrival Date must be a valid date.')
    .custom((value, { req }) => {
      const departureDateStr = `${req.body.departureDate}T${req.body.departureTime || '00:00'}:00`;
      const arrivalDateStr = `${value}T${req.body.expectedArrivalTime || '00:00'}:00`;
      const departureDate = new Date(departureDateStr);
      const arrivalDate = new Date(arrivalDateStr);
      
      if (arrivalDate <= departureDate) {
        throw new Error('Expected Arrival must be after Departure.');
      }
      return true;
    }),

  body('expectedArrivalTime')
    .notEmpty()
    .withMessage('Expected Arrival Time is required.')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Expected Arrival Time must be a valid time (HH:MM).'),
  
  body('distanceKm')
    .notEmpty()
    .withMessage('Distance is required.')
    .isFloat({ gt: 0 })
    .withMessage('Distance must be greater than zero.'),
  
  body('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'])
    .withMessage('Invalid status value.'),
  
  body('estimatedFuel')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Estimated fuel consumption cannot be negative.'),

  body('cargoPassengerDesc')
    .optional({ nullable: true, checkFalsy: true }),

  body('userNotes')
    .optional({ nullable: true, checkFalsy: true }),

  validate
];

export default { validateTrip };

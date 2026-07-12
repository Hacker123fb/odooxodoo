import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

/**
 * Validates request parameter entries for registering or updating vehicles
 */
export const validateVehicle = [
  body('registration_number')
    .trim()
    .notEmpty()
    .withMessage('Vehicle registration number is required.')
    .matches(/^[A-Z0-9\s-]+$/i)
    .withMessage('Registration number must be alphanumeric (hyphens/spaces allowed).'),
  
  body('model_id')
    .isInt({ min: 1 })
    .withMessage('Vehicle model/make selection is required.'),
  
  body('fuel_type_id')
    .isInt({ min: 1 })
    .withMessage('Fuel type selection is required.'),
  
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage(`Year must be a valid integer between 1900 and ${new Date().getFullYear() + 2}.`),
  
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Maximum load capacity must be greater than zero.'),
  
  body('current_odometer')
    .isInt({ min: 0 })
    .withMessage('Current odometer cannot be negative.'),
  
  body('purchase_price')
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost cannot be negative.'),
  
  body('status')
    .isIn(['Available', 'In Shop', 'Retired'])
    .withMessage('Status must be one of: Available, In Shop, or Retired.'),

  validate
];

export default { validateVehicle };

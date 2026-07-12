import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

export const validateMaintenance = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required.')
    .isInt({ min: 1 })
    .withMessage('Vehicle is required.'),

  body('maintenanceType')
    .trim()
    .notEmpty()
    .withMessage('Maintenance Type is required.')
    .isIn([
      'Routine Service',
      'Oil Change',
      'Tyre Replacement',
      'Brake Service',
      'Engine Repair',
      'Accident Repair',
      'Inspection',
      'Other'
    ])
    .withMessage('Invalid Maintenance Type selected.'),

  body('serviceCenter')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('maintenanceDate')
    .notEmpty()
    .withMessage('Maintenance Date is required.')
    .isISO8601()
    .withMessage('Maintenance Date must be a valid date.')
    .custom((value) => {
      const maintenanceDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permit same day up to end-of-day
      if (maintenanceDate > today) {
        throw new Error('Maintenance Date cannot be in the future.');
      }
      return true;
    }),

  body('estimatedCompletionDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Estimated Completion Date must be a valid date.')
    .custom((value, { req }) => {
      const estDate = new Date(value);
      const mainDate = new Date(req.body.maintenanceDate);
      if (estDate < mainDate) {
        throw new Error('Estimated Completion Date must be after Maintenance Date.');
      }
      return true;
    }),

  body('actualCompletionDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Actual Completion Date must be a valid date.')
    .custom((value, { req }) => {
      const actDate = new Date(value);
      const mainDate = new Date(req.body.maintenanceDate);
      if (actDate < mainDate) {
        throw new Error('Actual Completion Date cannot be before Maintenance Date.');
      }
      return true;
    }),

  body('cost')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost cannot be negative.'),

  body('odometerReading')
    .notEmpty()
    .withMessage('Odometer Reading is required.')
    .isInt({ min: 0 })
    .withMessage('Odometer Reading is required.'),

  body('technicianName')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('remarks')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled'])
    .withMessage('Invalid Status selected.'),

  validate
];

export default { validateMaintenance };

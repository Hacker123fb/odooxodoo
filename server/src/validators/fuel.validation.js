import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

export const validateFuel = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required.')
    .isInt({ min: 1 })
    .withMessage('Vehicle is required.'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Trip selection must be a valid ID.'),

  body('fuelDate')
    .notEmpty()
    .withMessage('Fuel Date is required.')
    .isISO8601()
    .withMessage('Fuel Date must be a valid date.')
    .custom((value) => {
      const fuelDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (fuelDate > today) {
        throw new Error('Fuel Date cannot be in the future.');
      }
      return true;
    }),

  body('fuelTypeId')
    .notEmpty()
    .withMessage('Fuel Type is required.')
    .isInt({ min: 1 })
    .withMessage('Fuel Type is required.'),

  body('fuelQuantity')
    .notEmpty()
    .withMessage('Fuel Quantity is required.')
    .isFloat({ gt: 0 })
    .withMessage('Fuel Quantity must be greater than zero.'),

  body('costPerLitre')
    .notEmpty()
    .withMessage('Cost per Litre is required.')
    .isFloat({ gt: 0 })
    .withMessage('Cost per Litre must be greater than zero.'),

  body('odometerReading')
    .notEmpty()
    .withMessage('Odometer Reading is required.')
    .isInt({ min: 0 })
    .withMessage('Odometer Reading is required.'),

  body('invoiceNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('fuelStation')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('paymentMethod')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['Cash', 'Card', 'UPI', 'Company Account', 'Other'])
    .withMessage('Invalid Payment Method selected.'),

  body('remarks')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  validate
];

export default { validateFuel };

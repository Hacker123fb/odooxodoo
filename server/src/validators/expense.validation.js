import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

export const validateExpense = [
  body('expenseDate')
    .notEmpty()
    .withMessage('Expense Date is required.')
    .isISO8601()
    .withMessage('Expense Date must be a valid date.')
    .custom((value) => {
      const expDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (expDate > today) {
        throw new Error('Expense Date cannot be in the future.');
      }
      return true;
    }),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Expense Category is required.')
    .isIn([
      'Maintenance',
      'Fuel',
      'Insurance',
      'Toll',
      'Parking',
      'Repair',
      'Driver Allowance',
      'Office Expense',
      'Miscellaneous'
    ])
    .withMessage('Invalid Expense Category selected.'),

  body('vehicleId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Vehicle must be a valid selection.'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Trip must be a valid selection.'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero.'),

  body('vendorName')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('invoiceNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment Method is required.')
    .isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Company Account', 'Other'])
    .withMessage('Invalid Payment Method selected.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 3 })
    .withMessage('Description must be at least 3 characters.'),

  body('remarks')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['Pending', 'Approved', 'Rejected', 'Paid'])
    .withMessage('Invalid Status selected.'),

  validate
];

export default { validateExpense };

import { Router } from 'express';
import expenseController from '../controllers/expense.controller.js';
import { validateExpense } from '../validators/expense.validation.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

// Require session validation for all endpoints in this module
router.use(protect);

/**
 * GET /api/v1/expenses
 * Retrieve list of all expense records with filters
 */
router.get('/', expenseController.getAll);

/**
 * GET /api/v1/expenses/meta/options
 * Retrieve selector options (vehicles, trips)
 */
router.get('/meta/options', expenseController.getMetadataOptions);

/**
 * GET /api/v1/expenses/:id
 * Retrieve details for a single expense record
 */
router.get('/:id', expenseController.getById);

/**
 * POST /api/v1/expenses
 * Create a new expense record
 * SUPER_ADMIN, FINANCIAL_ANALYST and FLEET_MANAGER can create
 */
router.post(
  '/',
  restrictTo('SUPER_ADMIN', 'FINANCIAL_ANALYST', 'FLEET_MANAGER'),
  validateExpense,
  expenseController.create
);

/**
 * PUT /api/v1/expenses/:id
 * Update details of an expense record
 * SUPER_ADMIN and FINANCIAL_ANALYST can update (approve/reject)
 * FLEET_MANAGER can update only pending expenses
 */
router.put(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FINANCIAL_ANALYST', 'FLEET_MANAGER'),
  validateExpense,
  expenseController.update
);

/**
 * DELETE /api/v1/expenses/:id
 * Remove an expense record
 */
router.delete(
  '/:id',
  restrictTo('SUPER_ADMIN', 'FINANCIAL_ANALYST'),
  expenseController.delete
);

export default router;

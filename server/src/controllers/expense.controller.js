import { expenseService } from '../services/expense.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const expenseController = {
  /**
   * GET /api/v1/expenses
   * List all expenses with filters
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', category = '', status = '', paymentMethod = '', vehicleId = '', tripId = '', startDate = '', endDate = '' } = req.query;
    const records = await expenseService.getRecords({ search, category, status, paymentMethod, vehicleId, tripId, startDate, endDate });
    return res.ok(records, 'Expense records retrieved successfully.');
  }),

  /**
   * GET /api/v1/expenses/:id
   * Fetch details for a single expense record
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await expenseService.getRecordById(id);
    return res.ok(record, 'Expense record retrieved successfully.');
  }),

  /**
   * POST /api/v1/expenses
   * Create a new expense
   */
  create: asyncHandler(async (req, res) => {
    const record = await expenseService.createRecord(req.body, req.user.id);
    return res.created(record, 'Expense recorded successfully.');
  }),

  /**
   * PUT /api/v1/expenses/:id
   * Update details of an expense record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await expenseService.updateRecord(id, req.body, req.user);
    return res.ok(record, 'Expense updated successfully.');
  }),

  /**
   * DELETE /api/v1/expenses/:id
   * Remove an expense record
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await expenseService.deleteRecord(id);
    return res.ok(null, 'Expense deleted successfully.');
  }),

  /**
   * GET /api/v1/expenses/meta/options
   * Retrieves selector options (vehicles, trips)
   */
  getMetadataOptions: asyncHandler(async (req, res) => {
    const options = await expenseService.getMetadataOptions();
    return res.ok(options, 'Selector options retrieved successfully.');
  })
};

export default expenseController;

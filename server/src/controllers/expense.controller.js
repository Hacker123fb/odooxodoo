import { expenseService } from '../services/expense.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { encodeId, decodeId } from '../utils/idCodec.js';
import auditService from '../services/audit.service.js';

export const expenseController = {
  /**
   * GET /api/v1/expenses
   * List all expenses with filters and alphanumeric IDs
   */
  getAll: asyncHandler(async (req, res) => {
    const { search = '', category = '', status = '', paymentMethod = '', vehicleId = '', tripId = '', startDate = '', endDate = '', page = 1, limit = 25 } = req.query;
    const parsedVehicleId = vehicleId ? decodeId(vehicleId) : '';
    const parsedTripId = tripId ? decodeId(tripId) : '';

    const result = await expenseService.getRecords({
      search,
      category,
      status,
      paymentMethod,
      vehicleId: parsedVehicleId,
      tripId: parsedTripId,
      startDate,
      endDate,
      page,
      limit
    });

    if (result && result.pagination) {
      const dataWithPublicIds = (result.data || []).map(e => ({
        ...e,
        publicId: encodeId('EXP', e.id),
        vehiclePublicId: e.vehicle_id ? encodeId('VEH', e.vehicle_id) : null,
        tripPublicId: e.trip_id ? encodeId('TRP', e.trip_id) : null
      }));
      return res.ok(dataWithPublicIds, 'Expense records retrieved successfully.', result.pagination);
    }

    const dataWithPublicIds = Array.isArray(result)
      ? result.map(e => ({
          ...e,
          publicId: encodeId('EXP', e.id),
          vehiclePublicId: e.vehicle_id ? encodeId('VEH', e.vehicle_id) : null,
          tripPublicId: e.trip_id ? encodeId('TRP', e.trip_id) : null
        }))
      : result;

    return res.ok(dataWithPublicIds, 'Expense records retrieved successfully.');
  }),

  /**
   * GET /api/v1/expenses/:id
   * Fetch details for a single expense record supporting alphanumeric ID (e.g. EXP-LC3A5W)
   */
  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid expense record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    const record = await expenseService.getRecordById(numId);
    if (!record) {
      throw new AppError('Expense record was not found.', HttpStatusCodes.NOT_FOUND);
    }
    record.publicId = encodeId('EXP', record.id);
    if (record.vehicle_id) record.vehiclePublicId = encodeId('VEH', record.vehicle_id);
    if (record.trip_id) record.tripPublicId = encodeId('TRP', record.trip_id);
    return res.ok(record, 'Expense record retrieved successfully.');
  }),

  /**
   * POST /api/v1/expenses
   * Create a new expense
   */
  create: asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.tripId) body.tripId = decodeId(body.tripId);

    const record = await expenseService.createRecord(body, req.user.id);
    if (record) {
      record.publicId = encodeId('EXP', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'RECORD_EXPENSE',
      status: 'SUCCESS',
      resourceType: 'expense',
      resourceId: record?.publicId || record?.id,
      details: {
        category: body.category,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        receiptNumber: body.receiptNumber
      }
    });

    return res.created(record, 'Expense recorded successfully.');
  }),

  /**
   * PUT /api/v1/expenses/:id
   * Update details of an expense record
   */
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid expense record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }

    const body = { ...req.body };
    if (body.vehicleId) body.vehicleId = decodeId(body.vehicleId);
    if (body.tripId) body.tripId = decodeId(body.tripId);

    const record = await expenseService.updateRecord(numId, body, req.user);
    if (record) {
      record.publicId = encodeId('EXP', record.id);
    }

    auditService.logActionEvent({
      req,
      action: 'UPDATE_EXPENSE',
      status: 'SUCCESS',
      resourceType: 'expense',
      resourceId: encodeId('EXP', numId),
      details: {
        status: body.status,
        updatedFields: Object.keys(body)
      }
    });

    return res.ok(record, 'Expense updated successfully.');
  }),

  /**
   * DELETE /api/v1/expenses/:id
   * Remove an expense record
   */
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const numId = decodeId(id);
    if (!numId) {
      throw new AppError('Invalid expense record identifier parameter.', HttpStatusCodes.BAD_REQUEST);
    }
    await expenseService.deleteRecord(numId);

    auditService.logActionEvent({
      req,
      action: 'DELETE_EXPENSE',
      status: 'SUCCESS',
      resourceType: 'expense',
      resourceId: encodeId('EXP', numId),
      details: { deletedExpenseId: numId }
    });

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

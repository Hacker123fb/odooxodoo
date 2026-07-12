import expenseModel from '../models/expense.model.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import pool from '../config/db.js';

// Maps UI category labels to database ENUM values
const mapCategoryToDb = (uiCategory) => {
  const map = {
    'Maintenance': 'MAINTENANCE',
    'Fuel': 'FUEL',
    'Insurance': 'INSURANCE',
    'Toll': 'TOLL',
    'Parking': 'OTHER',
    'Repair': 'MAINTENANCE',
    'Driver Allowance': 'SALARY',
    'Office Expense': 'OTHER',
    'Miscellaneous': 'OTHER'
  };
  return map[uiCategory] || 'OTHER';
};

// Maps DB ENUM category back to the closest UI label stored in notes
const mapDbCategoryToUi = (dbCategory, storedUiCategory) => {
  // Prefer the stored UI category from notes if available
  if (storedUiCategory) return storedUiCategory;
  const map = {
    'FUEL': 'Fuel',
    'MAINTENANCE': 'Maintenance',
    'TOLL': 'Toll',
    'INSURANCE': 'Insurance',
    'REGISTRATION': 'Miscellaneous',
    'SALARY': 'Driver Allowance',
    'PENALTY': 'Miscellaneous',
    'OTHER': 'Miscellaneous'
  };
  return map[dbCategory] || 'Miscellaneous';
};

// Maps UI payment method labels to database ENUM values
const mapPaymentToDb = (uiPayment) => {
  const map = {
    'Cash': 'CASH',
    'Card': 'CARD',
    'UPI': 'UPI',
    'Bank Transfer': 'BANK_TRANSFER',
    'Company Account': 'CHEQUE',
    'Other': 'CASH'
  };
  return map[uiPayment] || 'CASH';
};

// Maps DB ENUM payment method to UI labels
const mapDbPaymentToUi = (dbPayment, storedUiPayment) => {
  if (storedUiPayment) return storedUiPayment;
  const map = {
    'CASH': 'Cash',
    'CARD': 'Card',
    'UPI': 'UPI',
    'BANK_TRANSFER': 'Bank Transfer',
    'CHEQUE': 'Company Account'
  };
  return map[dbPayment] || 'Cash';
};

// Maps UI status to database status ENUMs
const mapStatusToDb = (uiStatus) => {
  const map = {
    'Pending': 'PENDING',
    'Approved': 'PENDING',
    'Rejected': 'REJECTED',
    'Paid': 'PAID'
  };
  return map[uiStatus] || 'PENDING';
};

// Maps DB status back to UI labels
const mapDbStatusToUi = (dbStatus, storedUiStatus) => {
  if (storedUiStatus) return storedUiStatus;
  if (dbStatus === 'PENDING') return 'Pending';
  if (dbStatus === 'PAID') return 'Paid';
  if (dbStatus === 'REJECTED') return 'Rejected';
  if (dbStatus === 'REIMBURSED') return 'Paid';
  return 'Pending';
};

// JSON serializer for notes
const serializeNotes = (vendorName = '', remarks = '', uiCategory = '', uiPaymentMethod = '', uiStatus = '') => {
  return JSON.stringify({
    vendorName: vendorName || '',
    remarks: remarks || '',
    uiCategory: uiCategory || '',
    uiPaymentMethod: uiPaymentMethod || '',
    uiStatus: uiStatus || ''
  });
};

// JSON deserializer for notes
const deserializeNotes = (notesField) => {
  if (!notesField) {
    return { vendorName: '', remarks: '', uiCategory: '', uiPaymentMethod: '', uiStatus: '' };
  }
  try {
    const parsed = JSON.parse(notesField);
    if (parsed && typeof parsed === 'object') {
      return {
        vendorName: parsed.vendorName || '',
        remarks: parsed.remarks || '',
        uiCategory: parsed.uiCategory || '',
        uiPaymentMethod: parsed.uiPaymentMethod || '',
        uiStatus: parsed.uiStatus || ''
      };
    }
  } catch (e) {
    // Return raw text if not JSON
  }
  return { vendorName: '', remarks: notesField, uiCategory: '', uiPaymentMethod: '', uiStatus: '' };
};

// Formats returned query rows to camelCase
const formatRow = (r) => {
  if (!r) return null;
  const parsedNotes = deserializeNotes(r.notes);
  const expenseDate = r.expense_date ? new Date(r.expense_date).toISOString().split('T')[0] : '';

  return {
    id: r.id,
    expenseNumber: r.expense_number,
    category: mapDbCategoryToUi(r.category, parsedNotes.uiCategory),
    categoryDb: r.category,
    vehicleId: r.vehicle_id,
    vehicle_plate: r.vehicle_plate || null,
    vehicle_make: r.vehicle_make || null,
    vehicle_model: r.vehicle_model || null,
    tripId: r.trip_id,
    trip_code: r.trip_code || null,
    amount: parseFloat(r.amount),
    description: r.description,
    invoiceNumber: r.receipt_number,
    expenseDate,
    paymentMethod: mapDbPaymentToUi(r.payment_method, parsedNotes.uiPaymentMethod),
    status: mapDbStatusToUi(r.payment_status, parsedNotes.uiStatus),
    statusDb: r.payment_status,
    vendorName: parsedNotes.vendorName,
    remarks: parsedNotes.remarks,
    approvedBy: r.approved_by,
    approver_name: r.approver_name || null,
    approvedAt: r.approved_at,
    creator_name: r.creator_name,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
};

export const expenseService = {
  /**
   * Fetches lists of expense records
   */
  async getRecords(filters) {
    const rows = await expenseModel.findAll(filters);
    return rows.map(formatRow);
  },

  /**
   * Fetches single expense record by ID
   */
  async getRecordById(id) {
    const record = await expenseModel.findById(id);
    if (!record) {
      throw new AppError('Expense record not found.', HttpStatusCodes.NOT_FOUND);
    }
    return formatRow(record);
  },

  /**
   * Creates a new expense record
   */
  async createRecord(data, creatorId) {
    // 1. Validate trip exists if provided
    if (data.tripId) {
      const [tripRows] = await pool.query('SELECT id FROM trips WHERE id = ?', [data.tripId]);
      if (tripRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'tripId', message: 'Selected trip does not exist.' }
        ]);
      }
    }

    // 2. Validate vehicle exists if provided
    if (data.vehicleId) {
      const [vehicleRows] = await pool.query('SELECT id FROM vehicles WHERE id = ?', [data.vehicleId]);
      if (vehicleRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'vehicleId', message: 'Selected vehicle does not exist.' }
        ]);
      }
    }

    // 3. Invoice Number uniqueness checking
    if (data.invoiceNumber) {
      const duplicate = await expenseModel.findByInvoice(data.invoiceNumber);
      if (duplicate) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'invoiceNumber', message: 'Invoice Number is already registered.' }
        ]);
      }
    }

    // 4. Generate expense number
    const expenseNumber = await expenseModel.generateExpenseNumber();

    // 5. Map UI values to DB ENUMs
    const categoryDb = mapCategoryToDb(data.category);
    const paymentMethodDb = mapPaymentToDb(data.paymentMethod);
    const paymentStatusDb = mapStatusToDb(data.status);

    const serializedNotes = serializeNotes(
      data.vendorName,
      data.remarks,
      data.category,
      data.paymentMethod,
      data.status
    );

    // 6. Set approval if status is Approved or Paid
    let approvedBy = null;
    let approvedAt = null;
    if (data.status === 'Approved' || data.status === 'Paid') {
      approvedBy = creatorId;
      approvedAt = new Date();
    }

    const recordId = await expenseModel.create({
      expenseNumber,
      categoryDb,
      vehicleId: data.vehicleId || null,
      tripId: data.tripId || null,
      amount: parseFloat(data.amount),
      description: data.description,
      receiptNumber: data.invoiceNumber,
      expenseDate: data.expenseDate,
      paymentMethodDb,
      paymentStatusDb,
      notes: serializedNotes,
      createdBy: creatorId
    });

    // If approved/paid, update the approved_by and approved_at
    if (approvedBy) {
      await pool.query(
        'UPDATE expenses SET approved_by = ?, approved_at = ? WHERE id = ?',
        [approvedBy, approvedAt, recordId]
      );
    }

    return this.getRecordById(recordId);
  },

  /**
   * Updates an existing expense record
   */
  async updateRecord(id, data, currentUser) {
    const record = await expenseModel.findById(id);
    if (!record) {
      throw new AppError('Expense record not found.', HttpStatusCodes.NOT_FOUND);
    }

    // Business rule: Approved/Paid expenses cannot be edited except by SUPER_ADMIN
    const existingNotes = deserializeNotes(record.notes);
    const existingUiStatus = mapDbStatusToUi(record.payment_status, existingNotes.uiStatus);
    if ((existingUiStatus === 'Approved' || existingUiStatus === 'Paid') && currentUser.role_name !== 'SUPER_ADMIN') {
      throw new AppError(
        'Approved or Paid expenses can only be edited by a Super Admin.',
        HttpStatusCodes.FORBIDDEN
      );
    }

    // 1. Validate trip exists if provided
    if (data.tripId) {
      const [tripRows] = await pool.query('SELECT id FROM trips WHERE id = ?', [data.tripId]);
      if (tripRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'tripId', message: 'Selected trip does not exist.' }
        ]);
      }
    }

    // 2. Validate vehicle exists if provided
    if (data.vehicleId) {
      const [vehicleRows] = await pool.query('SELECT id FROM vehicles WHERE id = ?', [data.vehicleId]);
      if (vehicleRows.length === 0) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'vehicleId', message: 'Selected vehicle does not exist.' }
        ]);
      }
    }

    // 3. Invoice Number uniqueness checking (excluding current record)
    if (data.invoiceNumber) {
      const duplicate = await expenseModel.findByInvoice(data.invoiceNumber, id);
      if (duplicate) {
        throw new AppError('Validation failed.', HttpStatusCodes.BAD_REQUEST, [
          { field: 'invoiceNumber', message: 'Invoice Number is already registered.' }
        ]);
      }
    }

    // 4. Map UI values to DB ENUMs
    const categoryDb = mapCategoryToDb(data.category);
    const paymentMethodDb = mapPaymentToDb(data.paymentMethod);
    const paymentStatusDb = mapStatusToDb(data.status);

    const serializedNotes = serializeNotes(
      data.vendorName,
      data.remarks,
      data.category,
      data.paymentMethod,
      data.status
    );

    // 5. Set approval tracking
    let approvedBy = record.approved_by;
    let approvedAt = record.approved_at;
    if (data.status === 'Approved' || data.status === 'Paid') {
      if (!approvedBy) {
        approvedBy = currentUser.id;
        approvedAt = new Date();
      }
    } else {
      approvedBy = null;
      approvedAt = null;
    }

    await expenseModel.update(id, {
      categoryDb,
      vehicleId: data.vehicleId || null,
      tripId: data.tripId || null,
      amount: parseFloat(data.amount),
      description: data.description,
      receiptNumber: data.invoiceNumber,
      expenseDate: data.expenseDate,
      paymentMethodDb,
      paymentStatusDb,
      approvedBy,
      approvedAt,
      notes: serializedNotes
    });

    return this.getRecordById(id);
  },

  /**
   * Deletes an expense record
   */
  async deleteRecord(id) {
    const record = await expenseModel.findById(id);
    if (!record) {
      throw new AppError('Expense record not found.', HttpStatusCodes.NOT_FOUND);
    }

    await expenseModel.delete(id);
    return true;
  },

  /**
   * Retrieves dropdown options lists for vehicles and trips
   */
  async getMetadataOptions() {
    const [vehicles] = await pool.query(
      `SELECT v.id, v.registration_number, vm.name AS model_name, vma.name AS make_name
       FROM vehicles v
       JOIN vehicle_models vm ON v.model_id = vm.id
       JOIN vehicle_makes vma ON vm.make_id = vma.id
       ORDER BY v.registration_number`
    );

    const [trips] = await pool.query(
      `SELECT t.id, t.trip_number, t.source_location, t.destination_location
       FROM trips t
       ORDER BY t.created_at DESC`
    );

    return { vehicles, trips };
  }
};

export default { expenseService };

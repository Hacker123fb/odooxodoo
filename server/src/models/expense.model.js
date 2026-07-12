import pool from '../config/db.js';

/**
 * Database queries abstraction for the expenses table
 */
export const expenseModel = {
  /**
   * Retrieves all expense records matching optional filters and search patterns
   */
  async findAll({ search = '', category = '', status = '', paymentMethod = '', vehicleId = '', tripId = '', startDate = '', endDate = '' } = {}) {
    let sql = `
      SELECT e.*,
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             t.trip_number AS trip_code,
             u.full_name AS creator_name,
             ua.full_name AS approver_name
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      LEFT JOIN vehicle_makes vma ON vm.make_id = vma.id
      LEFT JOIN trips t ON e.trip_id = t.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users ua ON e.approved_by = ua.id
    `;

    const conditions = [];
    const params = [];

    if (search.trim() !== '') {
      conditions.push('(e.expense_number LIKE ? OR e.description LIKE ? OR e.receipt_number LIKE ? OR v.registration_number LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild);
    }

    if (category.trim() !== '') {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (status.trim() !== '') {
      conditions.push('e.payment_status = ?');
      params.push(status);
    }

    if (paymentMethod.trim() !== '') {
      conditions.push('e.payment_method = ?');
      params.push(paymentMethod);
    }

    if (vehicleId.trim() !== '') {
      conditions.push('e.vehicle_id = ?');
      params.push(parseInt(vehicleId, 10));
    }

    if (tripId.trim() !== '') {
      conditions.push('e.trip_id = ?');
      params.push(parseInt(tripId, 10));
    }

    if (startDate.trim() !== '') {
      conditions.push('e.expense_date >= ?');
      params.push(startDate);
    }

    if (endDate.trim() !== '') {
      conditions.push('e.expense_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves details for a single expense record
   */
  async findById(id) {
    const sql = `
      SELECT e.*,
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             t.trip_number AS trip_code,
             u.full_name AS creator_name,
             ua.full_name AS approver_name
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN vehicle_models vm ON v.model_id = vm.id
      LEFT JOIN vehicle_makes vma ON vm.make_id = vma.id
      LEFT JOIN trips t ON e.trip_id = t.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users ua ON e.approved_by = ua.id
      WHERE e.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Insert new expense record
   */
  async create({ expenseNumber, categoryDb, vehicleId, tripId, amount, description, receiptNumber, expenseDate, paymentMethodDb, paymentStatusDb, notes, createdBy }) {
    const sql = `
      INSERT INTO expenses (expense_number, category, vehicle_id, trip_id, amount, description, receipt_number, expense_date, payment_method, payment_status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      expenseNumber,
      categoryDb,
      vehicleId || null,
      tripId || null,
      amount,
      description,
      receiptNumber || null,
      expenseDate,
      paymentMethodDb,
      paymentStatusDb,
      notes,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing expense record
   */
  async update(id, { categoryDb, vehicleId, tripId, amount, description, receiptNumber, expenseDate, paymentMethodDb, paymentStatusDb, approvedBy, approvedAt, notes }) {
    const sql = `
      UPDATE expenses
      SET category = ?, vehicle_id = ?, trip_id = ?, amount = ?, description = ?, receipt_number = ?, expense_date = ?, payment_method = ?, payment_status = ?, approved_by = ?, approved_at = ?, notes = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      categoryDb,
      vehicleId || null,
      tripId || null,
      amount,
      description,
      receiptNumber || null,
      expenseDate,
      paymentMethodDb,
      paymentStatusDb,
      approvedBy || null,
      approvedAt || null,
      notes,
      id
    ]);
  },

  /**
   * Delete expense record
   */
  async delete(id) {
    const sql = 'DELETE FROM expenses WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Checks uniqueness of receipt_number (Invoice Number)
   */
  async findByInvoice(invoiceNumber, excludeId = null) {
    let sql = 'SELECT id FROM expenses WHERE receipt_number = ?';
    const params = [invoiceNumber];
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';

    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Generate the next expense number (EXP-YYYYMMDD-NNN)
   */
  async generateExpenseNumber() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `EXP-${dateStr}-`;

    const sql = "SELECT expense_number FROM expenses WHERE expense_number LIKE ? ORDER BY expense_number DESC LIMIT 1";
    const [rows] = await pool.query(sql, [`${prefix}%`]);

    let seq = 1;
    if (rows.length > 0) {
      const lastNum = rows[0].expense_number;
      const lastSeq = parseInt(lastNum.split('-').pop(), 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }
};

export default expenseModel;

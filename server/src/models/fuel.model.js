import pool from '../config/db.js';

/**
 * Database queries abstraction for the fuel_logs table
 */
export const fuelModel = {
  /**
   * Retrieves all fuel records matching optional filters and search patterns
   */
  async findAll({ search = '', vehicleId = '', fuelTypeId = '', startDate = '', endDate = '', paymentMethod = '' } = {}) {
    let sql = `
      SELECT f.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             ft.label AS fuel_type_label,
             t.trip_number AS trip_code,
             u.full_name AS creator_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN fuel_types ft ON f.fuel_type_id = ft.id
      LEFT JOIN trips t ON f.trip_id = t.id
      JOIN users u ON f.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];

    // Search query matches vehicle plate, trip code, or receipt number
    if (search.trim() !== '') {
      conditions.push('(v.registration_number LIKE ? OR t.trip_number LIKE ? OR f.receipt_number LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (vehicleId.trim() !== '') {
      conditions.push('f.vehicle_id = ?');
      params.push(parseInt(vehicleId, 10));
    }

    if (fuelTypeId.trim() !== '') {
      conditions.push('f.fuel_type_id = ?');
      params.push(parseInt(fuelTypeId, 10));
    }

    if (paymentMethod.trim() !== '') {
      conditions.push("JSON_UNQUOTE(JSON_EXTRACT(f.notes, '$.paymentMethod')) = ?");
      params.push(paymentMethod);
    }

    // Fuel Date range filters
    if (startDate.trim() !== '') {
      conditions.push('f.fueling_date >= ?');
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate.trim() !== '') {
      conditions.push('f.fueling_date <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY f.fueling_date DESC, f.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves details for a single fuel log record
   */
  async findById(id) {
    const sql = `
      SELECT f.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             v.current_odometer AS vehicle_current_odometer,
             ft.label AS fuel_type_label,
             t.trip_number AS trip_code,
             u.full_name AS creator_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN fuel_types ft ON f.fuel_type_id = ft.id
      LEFT JOIN trips t ON f.trip_id = t.id
      JOIN users u ON f.created_by = u.id
      WHERE f.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Insert new fuel log record
   */
  async create({ vehicleId, driverId, tripId, fuelTypeId, quantity, pricePerUnit, totalCost, odometerReading, fuelingDate, receiptNumber, notes, createdBy }) {
    const sql = `
      INSERT INTO fuel_logs (vehicle_id, driver_id, trip_id, fuel_type_id, quantity, price_per_unit, total_cost, odometer_reading, fueling_date, receipt_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      vehicleId,
      driverId || null,
      tripId || null,
      fuelTypeId,
      quantity,
      pricePerUnit,
      totalCost,
      odometerReading,
      fuelingDate,
      receiptNumber || null,
      notes,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing fuel log record
   */
  async update(id, { vehicleId, driverId, tripId, fuelTypeId, quantity, pricePerUnit, totalCost, odometerReading, fuelingDate, receiptNumber, notes }) {
    const sql = `
      UPDATE fuel_logs
      SET vehicle_id = ?, driver_id = ?, trip_id = ?, fuel_type_id = ?, quantity = ?, price_per_unit = ?, total_cost = ?, odometer_reading = ?, fueling_date = ?, receipt_number = ?, notes = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      vehicleId,
      driverId || null,
      tripId || null,
      fuelTypeId,
      quantity,
      pricePerUnit,
      totalCost,
      odometerReading,
      fuelingDate,
      receiptNumber || null,
      notes,
      id
    ]);
  },

  /**
   * Delete fuel log record
   */
  async delete(id) {
    const sql = 'DELETE FROM fuel_logs WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Checks uniqueness of receipt_number (Invoice Number)
   */
  async findByInvoice(invoiceNumber, excludeId = null) {
    let sql = 'SELECT id FROM fuel_logs WHERE receipt_number = ?';
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
   * Retrieves seeded fuel types from database
   */
  async getFuelTypes() {
    const sql = 'SELECT id, code, label, unit_label FROM fuel_types ORDER BY label';
    const [rows] = await pool.query(sql);
    return rows;
  }
};

export default fuelModel;

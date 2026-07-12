import pool from '../config/db.js';

/**
 * Database queries abstraction for the maintenance_logs table
 */
export const maintenanceModel = {
  /**
   * Retrieves all maintenance records matching optional filters and search patterns
   */
  async findAll({ search = '', status = '', vehicleId = '', maintenanceType = '', startDate = '', endDate = '' } = {}) {
    let sql = `
      SELECT m.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             u.full_name AS creator_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN users u ON m.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];

    // Search query matches vehicle plate or description (which stores the UI Maintenance Type)
    if (search.trim() !== '') {
      conditions.push('(v.registration_number LIKE ? OR m.description LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild);
    }

    if (status.trim() !== '') {
      conditions.push('m.status = ?');
      params.push(status);
    }

    if (vehicleId.trim() !== '') {
      conditions.push('m.vehicle_id = ?');
      params.push(parseInt(vehicleId, 10));
    }

    if (maintenanceType.trim() !== '') {
      conditions.push('m.description = ?');
      params.push(maintenanceType);
    }

    // Maintenance Start Date range filters
    if (startDate.trim() !== '') {
      conditions.push('m.start_date >= ?');
      params.push(startDate);
    }

    if (endDate.trim() !== '') {
      conditions.push('m.start_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY m.start_date DESC, m.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves details for a single maintenance record
   */
  async findById(id) {
    const sql = `
      SELECT m.*, 
             v.registration_number AS vehicle_plate,
             vm.name AS vehicle_model,
             vma.name AS vehicle_make,
             v.current_odometer AS vehicle_current_odometer,
             u.full_name AS creator_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Insert new maintenance record
   */
  async create({ vehicleId, maintenanceTypeDb, description, cost, odometerReading, startDate, endDate, statusDb, notes, createdBy }) {
    const sql = `
      INSERT INTO maintenance_logs (vehicle_id, maintenance_type, description, cost, odometer_reading, start_date, end_date, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      vehicleId,
      maintenanceTypeDb,
      description,
      cost,
      odometerReading,
      startDate,
      endDate || null,
      statusDb,
      notes,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing maintenance record
   */
  async update(id, { vehicleId, maintenanceTypeDb, description, cost, odometerReading, startDate, endDate, statusDb, notes }) {
    const sql = `
      UPDATE maintenance_logs
      SET vehicle_id = ?, maintenance_type = ?, description = ?, cost = ?, odometer_reading = ?, start_date = ?, end_date = ?, status = ?, notes = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      vehicleId,
      maintenanceTypeDb,
      description,
      cost,
      odometerReading,
      startDate,
      endDate || null,
      statusDb,
      notes,
      id
    ]);
  },

  /**
   * Delete maintenance record
   */
  async delete(id) {
    const sql = 'DELETE FROM maintenance_logs WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Checks if the vehicle already has another scheduled or in-progress maintenance record
   */
  async hasActiveMaintenance(vehicleId, excludeId = null) {
    let sql = `
      SELECT id FROM maintenance_logs
      WHERE vehicle_id = ? 
        AND status IN ('SCHEDULED', 'IN_PROGRESS')
    `;
    const params = [vehicleId];
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
  }
};

export default maintenanceModel;

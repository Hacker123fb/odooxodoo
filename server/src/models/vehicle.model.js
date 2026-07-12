import pool from '../config/db.js';

/**
 * Database queries abstraction for the Vehicles table
 */
export const vehicleModel = {
  /**
   * Retrieves all vehicles matching optional filters and search patterns
   */
  async findAll({ search = '', status = '', type = '' } = {}) {
    let sql = `
      SELECT v.*, 
             vm.name AS model_name, 
             vma.name AS make_name, 
             vt.name AS type_name, 
             ft.label AS fuel_label,
             u.full_name AS creator_name,
             EXISTS (
               SELECT 1 
               FROM trips t 
               WHERE t.vehicle_id = v.id 
                 AND t.status = 'IN_PROGRESS'
             ) AS is_on_trip
      FROM vehicles v
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
      JOIN fuel_types ft ON v.fuel_type_id = ft.id
      JOIN users u ON v.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];

    // Search matches plate, model name, or manufacturer make name
    if (search.trim() !== '') {
      conditions.push('(v.registration_number LIKE ? OR vm.name LIKE ? OR vma.name LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (type.trim() !== '') {
      conditions.push('vt.name = ?');
      params.push(type);
    }

    // Status filter dynamically maps active trip statuses
    if (status.trim() !== '') {
      if (status === 'Available') {
        conditions.push(`v.status = 'ACTIVE' AND NOT EXISTS (
          SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
        )`);
      } else if (status === 'On Trip') {
        conditions.push(`v.status = 'ACTIVE' AND EXISTS (
          SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'IN_PROGRESS'
        )`);
      } else if (status === 'In Shop') {
        conditions.push("v.status = 'IN_MAINTENANCE'");
      } else if (status === 'Retired') {
        conditions.push("v.status = 'RETIRED'");
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY v.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves detail rows for a single vehicle
   */
  async findById(id) {
    const sql = `
      SELECT v.*, 
             vm.name AS model_name, 
             vma.name AS make_name, 
             vt.name AS type_name, 
             ft.label AS fuel_label,
             u.full_name AS creator_name,
             EXISTS (
               SELECT 1 
               FROM trips t 
               WHERE t.vehicle_id = v.id 
                 AND t.status = 'IN_PROGRESS'
             ) AS is_on_trip
      FROM vehicles v
      JOIN vehicle_models vm ON v.model_id = vm.id
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
      JOIN fuel_types ft ON v.fuel_type_id = ft.id
      JOIN users u ON v.created_by = u.id
      WHERE v.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Utility to verify duplicate registration numbers
   */
  async findByRegistration(registrationNumber, excludeId = null) {
    let sql = 'SELECT id FROM vehicles WHERE registration_number = ?';
    const params = [registrationNumber];
    
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Insert new vehicle
   */
  async create({ registrationNumber, modelId, fuelTypeId, year, capacity, odometer, price, status, createdBy }) {
    const sql = `
      INSERT INTO vehicles (registration_number, model_id, fuel_type_id, year, capacity, current_odometer, purchase_price, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      registrationNumber,
      modelId,
      fuelTypeId,
      year,
      capacity,
      odometer,
      price,
      status,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing vehicle records
   */
  async update(id, { registrationNumber, modelId, fuelTypeId, year, capacity, odometer, price, status }) {
    const sql = `
      UPDATE vehicles
      SET registration_number = ?, model_id = ?, fuel_type_id = ?, year = ?, capacity = ?, current_odometer = ?, purchase_price = ?, status = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      registrationNumber,
      modelId,
      fuelTypeId,
      year,
      capacity,
      odometer,
      price,
      status,
      id
    ]);
  },

  /**
   * Delete vehicle from inventory
   */
  async delete(id) {
    const sql = 'DELETE FROM vehicles WHERE id = ?';
    await pool.query(sql, [id]);
  },

  /**
   * Fetch model dropdown list options
   */
  async getModels() {
    const sql = `
      SELECT vm.id, vm.name, vma.name AS make_name, vt.name AS type_name
      FROM vehicle_models vm
      JOIN vehicle_makes vma ON vm.make_id = vma.id
      JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
      ORDER BY vma.name, vm.name
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * Fetch fuel dropdown options
   */
  async getFuelTypes() {
    const sql = 'SELECT id, code, label FROM fuel_types ORDER BY label';
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * Fetch classifications dropdown options
   */
  async getTypes() {
    const sql = 'SELECT id, name FROM vehicle_types ORDER BY name';
    const [rows] = await pool.query(sql);
    return rows;
  }
};

export default vehicleModel;

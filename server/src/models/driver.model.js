import pool from '../config/db.js';

/**
 * Database queries abstraction for the Drivers table
 */
export const driverModel = {
  /**
   * Retrieves all drivers matching optional filters and search patterns
   */
  async findAll({ search = '', status = '' } = {}) {
    let sql = `
      SELECT d.*, 
             u.full_name AS creator_name
      FROM drivers d
      JOIN users u ON d.created_by = u.id
    `;
    
    const conditions = [];
    const params = [];

    if (search.trim() !== '') {
      conditions.push('(d.full_name LIKE ? OR d.employee_id LIKE ? OR d.license_number LIKE ? OR d.email LIKE ? OR d.phone LIKE ?)');
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild, wild);
    }

    if (status.trim() !== '') {
      conditions.push('d.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY d.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Retrieves details for a single driver
   */
  async findById(id) {
    const sql = `
      SELECT d.*, 
             u.full_name AS creator_name
      FROM drivers d
      JOIN users u ON d.created_by = u.id
      WHERE d.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Utility to verify duplicate license numbers
   */
  async findByLicense(licenseNumber, excludeId = null) {
    let sql = 'SELECT id FROM drivers WHERE license_number = ?';
    const params = [licenseNumber];
    
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Utility to verify duplicate employee IDs
   */
  async findByEmployeeId(employeeId, excludeId = null) {
    let sql = 'SELECT id FROM drivers WHERE employee_id = ?';
    const params = [employeeId];
    
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Utility to verify duplicate email addresses
   */
  async findByEmail(email, excludeId = null) {
    let sql = 'SELECT id FROM drivers WHERE email = ?';
    const params = [email];
    
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Utility to verify duplicate phone (mobile) numbers
   */
  async findByPhone(phone, excludeId = null) {
    let sql = 'SELECT id FROM drivers WHERE phone = ?';
    const params = [phone];
    
    if (excludeId !== null) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  },

  /**
   * Insert new driver
   */
  async create({ employeeId, fullName, email, phone, licenseNumber, licenseExpiry, licenseClass, status, notes, createdBy }) {
    const sql = `
      INSERT INTO drivers (employee_id, full_name, email, phone, license_number, license_expiry, license_class, status, notes, created_by, joining_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
    `;
    const [result] = await pool.query(sql, [
      employeeId,
      fullName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      licenseClass,
      status,
      notes,
      createdBy
    ]);
    return result.insertId;
  },

  /**
   * Update existing driver records
   */
  async update(id, { employeeId, fullName, email, phone, licenseNumber, licenseExpiry, licenseClass, status, notes }) {
    const sql = `
      UPDATE drivers
      SET employee_id = ?, full_name = ?, email = ?, phone = ?, license_number = ?, license_expiry = ?, license_class = ?, status = ?, notes = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      employeeId,
      fullName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      licenseClass,
      status,
      notes,
      id
    ]);
  },

  /**
   * Delete driver from roster
   */
  async delete(id) {
    const sql = 'DELETE FROM drivers WHERE id = ?';
    await pool.query(sql, [id]);
  }
};

export default driverModel;

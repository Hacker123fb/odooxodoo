import pool from '../config/db.js';

/**
 * User query helper methods
 */
export const userModel = {
  /**
   * Find a user by their email, joining roles table to get role name
   */
  async findByEmail(email) {
    const sql = `
      SELECT u.*, r.name AS role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `;
    const [rows] = await pool.query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * Find a user by their ID, joining roles table
   */
  async findById(id) {
    const sql = `
      SELECT u.*, r.name AS role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new user record
   */
  async create({ roleId, fullName, email, passwordHash, phone = null, status = 'ACTIVE' }) {
    const sql = `
      INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [roleId, fullName, email, passwordHash, phone, status]);
    return result.insertId;
  },

  /**
   * Find a role by its name
   */
  async getRoleByName(roleName) {
    const sql = 'SELECT * FROM roles WHERE name = ?';
    const [rows] = await pool.query(sql, [roleName]);
    return rows[0] || null;
  },

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    await pool.query(sql, [id]);
  }
};

export default userModel;

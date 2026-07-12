import pool from '../config/db.js';

export const otpModel = {
  /**
   * Delete all expired OTP entries
   */
  async deleteExpired() {
    const sql = 'DELETE FROM registration_otp WHERE expires_at < NOW()';
    await pool.query(sql);
  },

  /**
   * Find active OTP entry by email
   */
  async findByEmail(email) {
    // Automatically clean up expired ones first
    await this.deleteExpired();

    const sql = 'SELECT * FROM registration_otp WHERE email = ?';
    const [rows] = await pool.query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * Create or replace OTP entry for an email
   */
  async saveOtp({ email, otpHash, expiresAt, registrationData }) {
    // Delete any existing entries first
    await this.delete(email);

    const sql = `
      INSERT INTO registration_otp (email, otp_hash, expires_at, attempts, registration_data)
      VALUES (?, ?, ?, 0, ?)
    `;
    await pool.query(sql, [email, otpHash, expiresAt, JSON.stringify(registrationData)]);
  },

  /**
   * Increment validation attempt count
   */
  async incrementAttempts(email) {
    const sql = 'UPDATE registration_otp SET attempts = attempts + 1 WHERE email = ?';
    await pool.query(sql, [email]);
  },

  /**
   * Remove OTP record
   */
  async delete(email) {
    const sql = 'DELETE FROM registration_otp WHERE email = ?';
    await pool.query(sql, [email]);
  }
};

export default otpModel;

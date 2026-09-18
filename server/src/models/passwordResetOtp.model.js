import pool from '../config/db.js';

export const passwordResetOtpModel = {
  /**
   * Delete all expired password reset OTP entries
   */
  async deleteExpired() {
    const sql = 'DELETE FROM password_reset_otp WHERE expires_at < NOW()';
    await pool.query(sql);
  },

  /**
   * Find active password reset OTP entry by email
   */
  async findByEmail(email) {
    await this.deleteExpired();
    const sql = 'SELECT * FROM password_reset_otp WHERE email = ?';
    const [rows] = await pool.query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * Create or replace password reset OTP entry for an email
   */
  async saveOtp({ email, otpHash, expiresAt }) {
    await this.delete(email);

    const sql = `
      INSERT INTO password_reset_otp (email, otp_hash, expires_at, attempts)
      VALUES (?, ?, ?, 0)
    `;
    await pool.query(sql, [email, otpHash, expiresAt]);
  },

  /**
   * Increment validation attempt count
   */
  async incrementAttempts(email) {
    const sql = 'UPDATE password_reset_otp SET attempts = attempts + 1 WHERE email = ?';
    await pool.query(sql, [email]);
  },

  /**
   * Remove password reset OTP record
   */
  async delete(email) {
    const sql = 'DELETE FROM password_reset_otp WHERE email = ?';
    await pool.query(sql, [email]);
  }
};

export default passwordResetOtpModel;

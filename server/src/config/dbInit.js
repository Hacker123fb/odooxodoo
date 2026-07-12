import pool from './db.js';
import bcrypt from 'bcryptjs';

/**
 * Ensures required roles exist, creates a default Super Admin user,
 * and verifies that unique constraints on the drivers table exist.
 */
export const dbInit = async () => {
  console.log('[DATABASE] Starting database initialization...');
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Idempotently check and ensure unique constraints exist on the drivers table
    const [indexes] = await connection.query(
      `SELECT DISTINCT INDEX_NAME, COLUMN_NAME 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers'`
    );

    const emailHasUnique = indexes.some(idx => idx.COLUMN_NAME === 'email' && idx.INDEX_NAME !== 'PRIMARY');
    const phoneHasUnique = indexes.some(idx => idx.COLUMN_NAME === 'phone' && idx.INDEX_NAME !== 'PRIMARY');

    if (!emailHasUnique) {
      console.log('[DATABASE] Ensuring unique constraint on drivers.email...');
      try {
        await connection.query('ALTER TABLE drivers ADD UNIQUE KEY uq_drivers_email (email)');
      } catch (err) {
        console.warn('[DATABASE] Warning: Failed to create uq_drivers_email constraint:', err.message);
      }
    }

    if (!phoneHasUnique) {
      console.log('[DATABASE] Ensuring unique constraint on drivers.phone...');
      try {
        await connection.query('ALTER TABLE drivers ADD UNIQUE KEY uq_drivers_phone (phone)');
      } catch (err) {
        console.warn('[DATABASE] Warning: Failed to create uq_drivers_phone constraint:', err.message);
      }
    }

    // 2. Idempotently insert roles
    const defaultRoles = [
      { name: 'SUPER_ADMIN', desc: 'Full system access — manages roles, users, and configurations' },
      { name: 'FLEET_MANAGER', desc: 'Fleet administrator — manages vehicles and drivers' },
      { name: 'DISPATCHER', desc: 'Operations dispatcher — schedules and assigns trips' },
      { name: 'SAFETY_OFFICER', desc: 'Compliance auditor — monitors logs and safety scores' },
      { name: 'FINANCIAL_ANALYST', desc: 'Financial tracker — reviews expenses and fuel efficiency' }
    ];

    for (const role of defaultRoles) {
      await connection.query(
        `INSERT INTO roles (name, description) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [role.name, role.desc]
      );
    }
    console.log('[DATABASE] Roles verification completed.');

    // 3. Locate SUPER_ADMIN role ID
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['SUPER_ADMIN']);
    if (roles.length === 0) {
      throw new Error('SUPER_ADMIN role registration failed.');
    }
    const superAdminRoleId = roles[0].id;

    // 4. Create default Super Admin user account if missing
    const defaultAdminEmail = 'admin@transitops.com';
    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [defaultAdminEmail]);

    if (users.length === 0) {
      const hashedPassword = bcrypt.hashSync('password123', 10);
      await connection.query(
        `INSERT INTO users (role_id, full_name, email, password_hash, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [superAdminRoleId, 'Default Super Admin', defaultAdminEmail, hashedPassword, 'ACTIVE']
      );
      console.log(`[DATABASE] Default Super Admin user seeded: ${defaultAdminEmail} / password123`);
    } else {
      console.log(`[DATABASE] Default Super Admin user already exists.`);
    }

  } catch (err) {
    console.error(`[DATABASE] Seeding failed: ${err.message}`);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default dbInit;

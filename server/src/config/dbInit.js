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

    // 0. Idempotently create notifications table
    console.log('[DATABASE] Ensuring notifications table exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED  NULL,
        type        VARCHAR(50)   NOT NULL,
        title       VARCHAR(100)  NOT NULL,
        message     TEXT          NOT NULL,
        is_read     TINYINT(1)    NOT NULL DEFAULT 0,
        created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_notifications_user_id (user_id),
        KEY idx_notifications_is_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='System notifications and action items ledger'
    `);

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

    // 2. Perform Schema Migration for Trips locations columns if fk still exists
    const [cols] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trips' AND COLUMN_NAME = 'source_location'`
    );

    if (cols.length === 0) {
      console.log('[DATABASE] Migrating trips table to store locations as plain text...');
      
      // Try to drop foreign key fk_trips_origin_id
      try { await connection.query('ALTER TABLE trips DROP FOREIGN KEY fk_trips_origin_id'); } catch(e) {}
      // Try to drop foreign key fk_trips_destination_id
      try { await connection.query('ALTER TABLE trips DROP FOREIGN KEY fk_trips_destination_id'); } catch(e) {}
      
      // Try to drop index idx_trips_origin_id
      try { await connection.query('ALTER TABLE trips DROP KEY idx_trips_origin_id'); } catch(e) {}
      // Try to drop index idx_trips_destination_id
      try { await connection.query('ALTER TABLE trips DROP KEY idx_trips_destination_id'); } catch(e) {}

      // Drop old columns if they exist
      try { await connection.query('ALTER TABLE trips DROP COLUMN origin_id'); } catch(e) {}
      try { await connection.query('ALTER TABLE trips DROP COLUMN destination_id'); } catch(e) {}

      // Add columns
      try {
        await connection.query(
          `ALTER TABLE trips 
           ADD COLUMN source_location VARCHAR(100) NOT NULL AFTER trip_number,
           ADD COLUMN destination_location VARCHAR(100) NOT NULL AFTER source_location`
        );
        console.log('[DATABASE] trips table schema migration completed successfully.');
      } catch (err) {
        console.error('[DATABASE] Error adding new columns:', err.message);
      }
    }

    // 3. Idempotently insert roles
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

    // 4. Locate SUPER_ADMIN role ID
    const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['SUPER_ADMIN']);
    if (roles.length === 0) {
      throw new Error('SUPER_ADMIN role registration failed.');
    }
    const superAdminRoleId = roles[0].id;

    // 5. Create default Super Admin user account if missing
    const defaultAdminEmail = 'admin@transitops.com';
    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [defaultAdminEmail]);

    if (users.length === 0) {
      const hashedPassword = bcrypt.hashSync('password123', 10);
      await connection.query(
        `INSERT INTO users (role_id, full_name, email, password_hash, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [superAdminRoleId, 'Admin', defaultAdminEmail, hashedPassword, 'ACTIVE']
      );
      console.log(`[DATABASE] Admin user seeded: ${defaultAdminEmail} / password123`);
    } else {
      // Rename Default Super Admin to Admin automatically if it exists
      await connection.query("UPDATE users SET full_name = 'Admin' WHERE full_name = 'Default Super Admin'");
      console.log(`[DATABASE] Admin user already exists.`);
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

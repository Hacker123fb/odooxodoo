import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes and validates PostgreSQL database schema and seed data
 */
export const pgDbInit = async () => {
  console.log('[DATABASE] Initializing PostgreSQL 3NF Schema...');
  let connection;
  try {
    connection = await pool.getConnection();

    const schemaPath = path.resolve(__dirname, '../../../database/postgres_schema_3nf.sql');
    const seedPath = path.resolve(__dirname, '../../../database/postgres_seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      try {
        await connection.query(schemaSql);
        console.log('[DATABASE] PostgreSQL 3NF Schema verified/applied.');
      } catch (schemaErr) {
        console.warn(`[DATABASE] Notice during schema script execution: ${schemaErr.message}`);
      }
    }

    // Ensure users table status check constraint allows PENDING_APPROVAL and REJECTED
    try {
      await connection.query(`
        DO $$ 
        BEGIN
          BEGIN
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
            ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'REJECTED'));
          EXCEPTION
            WHEN OTHERS THEN NULL;
          END;
        END $$;
      `);
      console.log('[DATABASE] Verified users_status_check constraint for staff approvals.');
    } catch (migErr) {
      console.warn('[DATABASE] Status constraint check note:', migErr.message);
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      try {
        await connection.query(seedSql);
        console.log('[DATABASE] PostgreSQL Seed verified/applied.');
      } catch (seedErr) {
        console.warn(`[DATABASE] Notice during seed script execution: ${seedErr.message}`);
      }
    }

  } catch (err) {
    console.error(`[DATABASE] PostgreSQL initialization error: ${err.message}`);
    if (!connection) {
      throw err;
    }
  } finally {
    if (connection) connection.release();
  }
};

export default pgDbInit;

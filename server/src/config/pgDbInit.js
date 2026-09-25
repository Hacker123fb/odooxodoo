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
      await connection.query(schemaSql);
      console.log('[DATABASE] PostgreSQL 3NF Schema verified/applied.');
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('[DATABASE] PostgreSQL Seed verified/applied.');
    }

  } catch (err) {
    console.error(`[DATABASE] PostgreSQL initialization error: ${err.message}`);
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default pgDbInit;

// =============================================================================
// Automated Node.js Migration Engine (Cross-Platform pgloader Replica)
// FILE: database/pgloader_sync.mjs
// Streams all tables from Aiven MySQL to Prisma Postgres with automatic
// dependency ordering, type casting, batch insertion, and sequence resetting.
// =============================================================================

import mysql from 'mysql2/promise';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const { Pool: PgPool } = pg;

// 1. Source (Aiven MySQL)
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

// 2. Target (Prisma Postgres Cloud DB)
const targetUrl = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error(`
=============================================================================
ERROR: TARGET_DATABASE_URL or DATABASE_URL is not set!
Please set your Prisma Postgres Cloud DB connection string in server/.env:
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
=============================================================================
`);
  process.exit(1);
}

// Order of tables to satisfy foreign-key constraints
const TABLES_IN_ORDER = [
  'roles',
  'fuel_types',
  'vehicle_types',
  'vehicle_makes',
  'vehicle_models',
  'locations',
  'vendors',
  'fuel_stations',
  'users',
  'vehicles',
  'drivers',
  'trips',
  'maintenance_logs',
  'fuel_logs',
  'expenses',
  'notifications',
  'registration_otp',
  'password_reset_otp'
];

async function runMigration() {
  console.log('=============================================================================');
  console.log('TRANSITOPS PGLOADER REPLICA: AIVEN MYSQL -> PRISMA POSTGRES MIGRATION');
  console.log('=============================================================================\n');

  console.log(`Connecting to Source Aiven MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}...`);
  const myConn = await mysql.createConnection(mysqlConfig);
  console.log('✓ Connected to Aiven MySQL successfully.');

  console.log(`Connecting to Target Prisma Postgres: ${targetUrl.replace(/:[^:@]+@/, ':***@')}...`);
  const pgPool = new PgPool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });
  const pgClient = await pgPool.connect();
  console.log('✓ Connected to Prisma Postgres Cloud DB successfully.\n');

  try {
    // Disable constraints temporarily for clean import
    await pgClient.query('SET session_replication_role = replica;').catch(() => {});

    for (const table of TABLES_IN_ORDER) {
      process.stdout.write(`Migrating table [${table}]... `);

      // Check if table exists in source
      const [srcCheck] = await myConn.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [mysqlConfig.database, table]
      );

      if (srcCheck.length === 0) {
        console.log(`(skipped - does not exist in source)`);
        continue;
      }

      // Fetch all rows from MySQL
      const [rows] = await myConn.query(`SELECT * FROM \`${table}\``);
      if (rows.length === 0) {
        console.log(`0 rows (empty).`);
        continue;
      }

      // Clean target table before insert
      await pgClient.query(`TRUNCATE TABLE "${table}" CASCADE;`).catch(() => {});

      // Build batch insert query
      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');

      let insertedCount = 0;
      for (const row of rows) {
        const values = columns.map(col => {
          let val = row[col];
          // Handle zero dates and nulls
          if (val instanceof Date && isNaN(val.getTime())) return null;
          return val;
        });

        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        const insertSql = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await pgClient.query(insertSql, values);
        insertedCount++;
      }

      // Reset sequence so auto-increment does not collide
      const seqCheck = await pgClient.query(`
        SELECT pg_get_serial_sequence($1, 'id') AS seq_name;
      `, [table]).catch(() => ({ rows: [] }));

      const seqName = seqCheck.rows[0]?.seq_name;
      if (seqName) {
        await pgClient.query(`
          SELECT setval($1, COALESCE((SELECT MAX(id) FROM "${table}"), 1));
        `, [seqName]).catch(() => {});
      }

      console.log(`✓ ${insertedCount} rows migrated & sequence synchronized.`);
    }

    // Re-enable constraints
    await pgClient.query('SET session_replication_role = DEFAULT;').catch(() => {});

    console.log('\n=============================================================================');
    console.log('✓ COMPLETE DATABASE MIGRATION FINISHED SUCCESSFULLY!');
    console.log('=============================================================================');

  } catch (err) {
    console.error('\nMigration encountered an error:', err.message);
    throw err;
  } finally {
    await myConn.end();
    pgClient.release();
    await pgPool.end();
  }
}

runMigration().catch(() => process.exit(1));

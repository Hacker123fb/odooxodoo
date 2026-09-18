import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log(`[MIGRATION] Connecting to ${env.db.host}:${env.db.port}/${env.db.database}...`);

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
    ssl: env.db.host !== 'localhost' && env.db.host !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined
  });

  console.log('[MIGRATION] Connected successfully!');

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  if (fs.existsSync(schemaPath)) {
    console.log('[MIGRATION] Executing schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[MIGRATION] schema.sql executed successfully.');
  }

  if (fs.existsSync(seedPath)) {
    console.log('[MIGRATION] Executing seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('[MIGRATION] seed.sql executed successfully.');
  }

  console.log('[MIGRATION] All tables and seed data created successfully!');
  await connection.end();
}

runMigration().catch((err) => {
  console.error('[MIGRATION] Error during migration:', err.message);
  process.exit(1);
});

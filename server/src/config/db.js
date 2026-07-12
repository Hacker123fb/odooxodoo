import mysql from 'mysql2/promise';
import { env } from './env.js';

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[DATABASE] Connected to database: ${env.db.host}:${env.db.port}/${env.db.database}`);
    connection.release();
    return true;
  } catch (err) {
    console.error(`[DATABASE] Connection failed: ${err.message}`);
    return false;
  }
};

export default pool;

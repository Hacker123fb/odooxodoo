import mysql from 'mysql2/promise';
import pg from 'pg';
import { env } from './env.js';

const { Pool: PgPool } = pg;

let pool;
let isPg = false;

// Helper to translate MySQL '?' placeholders to PostgreSQL '$1, $2, ...'
const convertPlaceholders = (sql) => {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

if (env.isPostgres || env.databaseUrl) {
  isPg = true;
  const poolConfig = env.databaseUrl
    ? {
        connectionString: env.databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      }
    : {
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        ssl: env.db.host !== 'localhost' && env.db.host !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      };

  const rawPgPool = new PgPool(poolConfig);

  // Wrap pg pool to match mysql2 promise interface [rows, fields]
  pool = {
    isPostgres: true,
    async query(sql, params = []) {
      let pgSql = convertPlaceholders(sql);
      const isInsert = /^\s*insert\s+into/i.test(pgSql);
      
      // If INSERT and no RETURNING clause, add RETURNING id for auto-increment compatibility
      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      const res = await rawPgPool.query(pgSql, params);
      
      if (isInsert) {
        const insertId = res.rows[0]?.id || 0;
        const resultHeader = {
          insertId,
          affectedRows: res.rowCount,
          rows: res.rows
        };
        return [resultHeader, res.fields];
      }

      return [res.rows, res.fields];
    },

    async getConnection() {
      const client = await rawPgPool.connect();
      return {
        async query(sql, params = []) {
          let pgSql = convertPlaceholders(sql);
          const isInsert = /^\s*insert\s+into/i.test(pgSql);
          if (isInsert && !/returning/i.test(pgSql)) {
            pgSql += ' RETURNING id';
          }
          const res = await client.query(pgSql, params);
          if (isInsert) {
            const insertId = res.rows[0]?.id || 0;
            return [{ insertId, affectedRows: res.rowCount, rows: res.rows }, res.fields];
          }
          return [res.rows, res.fields];
        },
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        release() {
          client.release();
        }
      };
    },

    async end() {
      await rawPgPool.end();
    }
  };
} else {
  // MySQL Pool (default when MySQL variables are present)
  pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: env.db.host !== 'localhost' && env.db.host !== '127.0.0.1' ? { rejectUnauthorized: false } : undefined
  });
  pool.isPostgres = false;
}

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const dialect = isPg ? 'PostgreSQL' : 'MySQL';
    console.log(`[DATABASE] [${dialect}] Connected successfully to: ${env.databaseUrl ? 'DATABASE_URL' : `${env.db.host}:${env.db.port}/${env.db.database}`}`);
    connection.release();
    return true;
  } catch (err) {
    console.error(`[DATABASE] Connection failed: ${err.message}`);
    return false;
  }
};

export default pool;

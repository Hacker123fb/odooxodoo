import mysql from 'mysql2/promise.js';
import pg from 'pg';
import { env } from './env.js';

const { Pool: PgPool } = pg;

let pool;
let isPg = false;

// Helper to translate MySQL '?' placeholders and date functions to PostgreSQL
const convertPlaceholders = (sql) => {
  let paramIndex = 1;
  let converted = sql.replace(/\?/g, () => `$${paramIndex++}`);

  // Auto-translate MySQL date idioms to PostgreSQL equivalents
  converted = converted
    .replace(/DATE_ADD\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\d+)\s+([A-Za-z]+)\s*\)/gi, (_, date, num, unit) => {
      const u = unit.toLowerCase().replace(/s$/, '') + 's';
      const d = date.trim().toUpperCase() === 'CURDATE()' ? 'CURRENT_DATE' : date.trim();
      return `(${d} + INTERVAL '${num} ${u}')`;
    })
    .replace(/DATE_SUB\(\s*([^,]+?)\s*,\s*INTERVAL\s+(\d+)\s+([A-Za-z]+)\s*\)/gi, (_, date, num, unit) => {
      const u = unit.toLowerCase().replace(/s$/, '') + 's';
      const d = date.trim().toUpperCase() === 'CURDATE()' ? 'CURRENT_DATE' : date.trim();
      return `(${d} - INTERVAL '${num} ${u}')`;
    })
    .replace(/DATE_FORMAT\(\s*([^,]+)\s*,\s*'%Y-%m'\s*\)/gi, "TO_CHAR($1, 'YYYY-MM')")
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/\bYEAR\(([^)]+)\)/gi, 'EXTRACT(YEAR FROM $1)')
    .replace(/\bMONTH\(([^)]+)\)/gi, 'EXTRACT(MONTH FROM $1)')
    .replace(/DATE\((\w+(?:\.\w+)?)\)/gi, 'CAST($1 AS DATE)');

  return converted;
};

// Helper to remap PostgreSQL lowercased column names back to original camelCase aliases
const remapRowKeys = (rows, sql) => {
  if (!rows || !Array.isArray(rows) || rows.length === 0 || typeof rows[0] !== 'object') return rows;
  const aliasRegex = /\bAS\s+["`]?([a-zA-Z0-9_]+)["`]?/gi;
  const map = {};
  let match;
  while ((match = aliasRegex.exec(sql)) !== null) {
    const original = match[1];
    if (/[A-Z]/.test(original)) {
      map[original.toLowerCase()] = original;
    }
  }
  if (Object.keys(map).length === 0) return rows;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;
    for (const [lowerKey, origKey] of Object.entries(map)) {
      if (row[lowerKey] !== undefined && row[origKey] === undefined) {
        row[origKey] = row[lowerKey];
      }
    }
  }
  return rows;
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

      const rows = remapRowKeys(res.rows, sql);
      return [rows, res.fields];
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
          const rows = remapRowKeys(res.rows, sql);
          return [rows, res.fields];
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

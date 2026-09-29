import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the .env file in server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// Extract host and parameters from DATABASE_URL if present
let parsedHost = 'localhost';
let parsedPort = 5432;
let parsedUser = 'postgres';
let parsedDb = 'transitops';

if (databaseUrl) {
  try {
    const dummyUrl = new URL(databaseUrl.replace(/^postgres(?:ql)?:/, 'http:'));
    parsedHost = dummyUrl.hostname || parsedHost;
    parsedPort = dummyUrl.port ? parseInt(dummyUrl.port, 10) : 5432;
    parsedUser = dummyUrl.username || parsedUser;
    parsedDb = dummyUrl.pathname ? dummyUrl.pathname.replace(/^\//, '') : parsedDb;
  } catch (e) {}
}

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isPostgres: true,
  databaseUrl,
  db: {
    host: process.env.PGHOST || process.env.DB_HOST || parsedHost,
    port: parseInt(process.env.PGPORT || process.env.DB_PORT, 10) || parsedPort,
    user: process.env.PGUSER || process.env.DB_USER || parsedUser,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PGDATABASE || process.env.DB_NAME || parsedDb,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'transitops_jwt_secret_key_default',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  }
};

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the .env file in server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const isPostgres = 
  process.env.DB_TYPE === 'postgres' || 
  process.env.DB_DIALECT === 'postgres' || 
  databaseUrl.startsWith('postgres://') || 
  databaseUrl.startsWith('postgresql://') || 
  (process.env.DB_PORT && parseInt(process.env.DB_PORT, 10) === 5432);

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isPostgres,
  databaseUrl,
  db: {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT, 10) || (isPostgres ? 5432 : 3306),
    user: process.env.DB_USER || process.env.PGUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'transitops',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'transitops_jwt_secret_key_default',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  }
};

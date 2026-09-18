import { Router } from 'express';
import { env } from '../config/env.js';
import { testConnection } from '../config/db.js';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Get application health status
 */
router.get('/health', async (req, res) => {
  const isDbConnected = await testConnection();
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? 'TransitOps API & Database Healthy' : 'Database Connection Failed',
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    dbHost: env.db.host,
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

export default router;

import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Get application health status
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TransitOps API Running',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

export default router;

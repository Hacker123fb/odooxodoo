import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';

const router = Router();

// 1. Health check routes
router.use('/', healthRouter);

// 2. Authentication routes
router.use('/auth', authRouter);

// Helper helper to return a placeholder response for future feature routes
const createPlaceholder = (moduleName) => (req, res) => {
  return res.status(501).json({
    success: false,
    message: `${moduleName} module is not implemented yet. Foundation is ready.`
  });
};
router.all('/vehicles*', createPlaceholder('Vehicles'));
router.all('/drivers*', createPlaceholder('Drivers'));
router.all('/trips*', createPlaceholder('Trips'));
router.all('/maintenance*', createPlaceholder('Maintenance'));
router.all('/fuel*', createPlaceholder('Fuel'));
router.all('/expenses*', createPlaceholder('Expenses'));

export default router;

import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import vehicleRouter from './vehicle.routes.js';
import driverRouter from './driver.routes.js';

const router = Router();

// 1. Health check routes
router.use('/', healthRouter);

// 2. Authentication routes
router.use('/auth', authRouter);

// 3. Vehicles routes
router.use('/vehicles', vehicleRouter);

// 4. Drivers routes
router.use('/drivers', driverRouter);

// Helper helper to return a placeholder response for future feature routes
const createPlaceholder = (moduleName) => (req, res) => {
  return res.status(501).json({
    success: false,
    message: `${moduleName} module is not implemented yet. Foundation is ready.`
  });
};
router.all('/trips*', createPlaceholder('Trips'));
router.all('/maintenance*', createPlaceholder('Maintenance'));
router.all('/fuel*', createPlaceholder('Fuel'));
router.all('/expenses*', createPlaceholder('Expenses'));

export default router;

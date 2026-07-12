import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import vehicleRouter from './vehicle.routes.js';
import driverRouter from './driver.routes.js';
import tripRouter from './trip.routes.js';
import maintenanceRouter from './maintenance.routes.js';
import fuelRouter from './fuel.routes.js';
import expenseRouter from './expense.routes.js';
import dashboardRouter from './dashboard.routes.js';
import reportRouter from './report.routes.js';
import notificationRouter from './notification.routes.js';

const router = Router();

// 1. Health check routes
router.use('/', healthRouter);

// 2. Authentication routes
router.use('/auth', authRouter);

// 3. Vehicles routes
router.use('/vehicles', vehicleRouter);

// 4. Drivers routes
router.use('/drivers', driverRouter);

// 5. Trips routes
router.use('/trips', tripRouter);

// 6. Maintenance routes
router.use('/maintenance', maintenanceRouter);

// 7. Fuel routes
router.use('/fuel', fuelRouter);

// 8. Expenses routes
router.use('/expenses', expenseRouter);

// 9. Dashboard routes
router.use('/dashboard', dashboardRouter);

// 10. Reports routes
router.use('/reports', reportRouter);

// 11. Notifications routes
router.use('/notifications', notificationRouter);

export default router;

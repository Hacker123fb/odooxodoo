import { Router } from 'express';
import { apiMutationLimiter, apiQueryLimiter } from '../middleware/rateLimiter.js';
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
import auditRouter from './audit.routes.js';
import securityRouter from './security.routes.js';

const router = Router();

// Apply fast rate limiting across all API endpoints:
// - Rapid write mutations: 120 / min
// - High-speed queries: 240 / min
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
    return apiMutationLimiter(req, res, next);
  }
  return apiQueryLimiter(req, res, next);
});

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

// 12. Admin Security & Audit Activity Logs
router.use('/admin/audit-logs', auditRouter);

// 13. Super Admin Security Access Control (IP Revocation & Account Lockdown)
router.use('/admin/security', securityRouter);

export default router;

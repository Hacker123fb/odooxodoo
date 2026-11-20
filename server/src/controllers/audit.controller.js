import auditService from '../services/audit.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import fs from 'fs';

export const auditController = {
  /**
   * GET /api/v1/admin/audit-logs
   * Retrieve list of audit logs with search, filtering, and pagination
   */
  getLogs: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status = '', action = '', search = '', startDate = '', endDate = '' } = req.query;
    const result = await auditService.getAuditLogs({ page, limit, status, action, search, startDate, endDate });
    return res.ok(result.data, 'Audit activity logs retrieved successfully.', result.pagination);
  }),

  /**
   * GET /api/v1/admin/audit-logs/stats
   * Retrieve summary metrics for audit dashboard
   */
  getStats: asyncHandler(async (req, res) => {
    const stats = await auditService.getAuditStats();
    return res.ok(stats, 'Audit statistics retrieved successfully.');
  }),

  /**
   * GET /api/v1/admin/audit-logs/download
   * Download the physical audit.log file
   */
  downloadLogs: asyncHandler(async (req, res) => {
    const filePath = auditService.getAuditLogFilePath();
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Audit log file is empty or not yet generated.' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=transitops-audit-log-${new Date().toISOString().slice(0, 10)}.log`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  })
};

export default auditController;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Physical log file path in server/logs/audit.log
const logsDir = path.resolve(__dirname, '../../logs');
const auditLogFilePath = path.join(logsDir, 'audit.log');

// Ensure server/logs directory exists
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[AUDIT] Failed to create logs directory:', e.message);
}

/**
 * Extract clean IP address from Express request
 */
export const extractClientIp = (req) => {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

/**
 * Append entry to physical audit.log file (Non-blocking)
 */
const appendToLogFile = (entry) => {
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(auditLogFilePath, line, 'utf8', (err) => {
      if (err) {
        console.warn('[AUDIT FILE ERROR] Failed to write to audit.log:', err.message);
      }
    });
  } catch (err) {
    console.warn('[AUDIT FILE ERROR]:', err.message);
  }
};

/**
 * Core Audit & Activity Logger
 */
export const auditService = {
  getAuditLogFilePath: () => auditLogFilePath,

  /**
   * Log an Authentication Event (Login Success, Login Failure, Logout, etc.)
   */
  logAuthEvent: async ({ req, action, status, email, user, details = {} }) => {
    try {
      const ip = extractClientIp(req);
      const userAgent = req?.headers['user-agent'] || 'Unknown Browser/Agent';
      const pathUrl = req?.originalUrl || req?.url || '/api/v1/auth';
      const method = req?.method || 'POST';
      const timestamp = new Date().toISOString();

      const userEmail = email || user?.email || details?.attemptedEmail || 'Unspecified';
      const userId = user?.id || null;
      const userName = user?.name || user?.full_name || 'Anonymous User';
      const userRole = user?.role || user?.role_name || 'ANONYMOUS';

      const entry = {
        timestamp,
        ip_address: ip,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        user_role: userRole,
        action,
        status, // 'SUCCESS' or 'FAILED'
        path: pathUrl,
        method,
        user_agent: userAgent,
        details
      };

      // 1. Immediately append to physical file
      appendToLogFile(entry);

      // 2. Persist to PostgreSQL audit_logs table asynchronously
      pool.query(
        `INSERT INTO audit_logs (timestamp, ip_address, user_id, user_email, user_name, user_role, action, status, path, method, user_agent, details)
         VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)`,
        [
          ip,
          userId,
          userEmail,
          userName,
          userRole,
          action,
          status,
          pathUrl,
          method,
          userAgent,
          JSON.stringify(details)
        ]
      ).catch((dbErr) => {
        // Table might not exist yet before migration, safely ignore
      });

    } catch (err) {
      console.warn('[AUDIT LOG ERROR]:', err.message);
    }
  },

  /**
   * Log an Operational Action Event (Create, Update, Delete)
   */
  logActionEvent: async ({ req, action, status = 'SUCCESS', resourceType, resourceId, details = {} }) => {
    try {
      const ip = extractClientIp(req);
      const userAgent = req?.headers['user-agent'] || 'Unknown Browser/Agent';
      const pathUrl = req?.originalUrl || req?.url || '';
      const method = req?.method || 'POST';
      const timestamp = new Date().toISOString();

      const currentUser = req?.user || {};
      const userId = currentUser.id || null;
      const userEmail = currentUser.email || 'system';
      const userName = currentUser.name || currentUser.full_name || 'Staff User';
      const userRole = currentUser.role || currentUser.role_name || 'STAFF';

      const entry = {
        timestamp,
        ip_address: ip,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        user_role: userRole,
        action,
        status,
        path: pathUrl,
        method,
        user_agent: userAgent,
        details: {
          resourceType,
          resourceId,
          ...details
        }
      };

      appendToLogFile(entry);

      pool.query(
        `INSERT INTO audit_logs (timestamp, ip_address, user_id, user_email, user_name, user_role, action, status, path, method, user_agent, details)
         VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)`,
        [
          ip,
          userId,
          userEmail,
          userName,
          userRole,
          action,
          status,
          pathUrl,
          method,
          userAgent,
          JSON.stringify({ resourceType, resourceId, ...details })
        ]
      ).catch(() => {});

    } catch (err) {
      console.warn('[AUDIT LOG ACTION ERROR]:', err.message);
    }
  },

  /**
   * Query Audit Logs with Filtering, Search & Pagination
   */
  getAuditLogs: async ({ page = 1, limit = 50, status = '', action = '', search = '', startDate = '', endDate = '' }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    try {
      // Attempt DB query first
      const whereClauses = [];
      const params = [];

      if (status) {
        whereClauses.push('status = ?');
        params.push(status.toUpperCase());
      }
      if (action) {
        whereClauses.push('action LIKE ?');
        params.push(`%${action}%`);
      }
      if (search) {
        whereClauses.push('(user_email ILIKE ? OR user_name ILIKE ? OR ip_address ILIKE ? OR action ILIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }
      if (startDate) {
        whereClauses.push('timestamp >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereClauses.push('timestamp <= ?');
        params.push(endDate);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`;
      const [countRows] = await pool.query(countSql, params);
      const total = parseInt(countRows[0]?.total || '0', 10);

      const dataSql = `
        SELECT id, timestamp, ip_address, user_id, user_email, user_name, user_role, action, status, path, method, user_agent, details
        FROM audit_logs
        ${whereSql}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

      return {
        data: rows || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      };
    } catch (err) {
      // Fallback: Read and parse from physical file audit.log
      console.warn('[AUDIT] Reading from physical file fallback:', err.message);
      return readLogsFromFile({ pageNum, limitNum, status, action, search });
    }
  },

  /**
   * Get High-Level Metrics for Admin Overview
   */
  getAuditStats: async () => {
    try {
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
      const [successLogins] = await pool.query("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_SUCCESS'");
      const [failedLogins] = await pool.query("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'LOGIN_FAILED'");
      const [uniqueIps] = await pool.query('SELECT COUNT(DISTINCT ip_address) as count FROM audit_logs');
      const [todayEvents] = await pool.query('SELECT COUNT(*) as count FROM audit_logs WHERE timestamp >= CURRENT_DATE');

      return {
        totalEvents: parseInt(totalRows[0]?.total || '0', 10),
        successfulLogins: parseInt(successLogins[0]?.count || '0', 10),
        failedLogins: parseInt(failedLogins[0]?.count || '0', 10),
        uniqueIps: parseInt(uniqueIps[0]?.count || '0', 10),
        todayEvents: parseInt(todayEvents[0]?.count || '0', 10)
      };
    } catch (err) {
      return {
        totalEvents: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueIps: 0,
        todayEvents: 0
      };
    }
  }
};

/**
 * Helper to parse physical audit.log file on disk
 */
const readLogsFromFile = ({ pageNum, limitNum, status, action, search }) => {
  if (!fs.existsSync(auditLogFilePath)) {
    return { data: [], pagination: { page: 1, limit: limitNum, total: 0, totalPages: 1 } };
  }

  const raw = fs.readFileSync(auditLogFilePath, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  let parsed = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const item = JSON.parse(lines[i]);
      if (status && item.status !== status) continue;
      if (action && !item.action.toLowerCase().includes(action.toLowerCase())) continue;
      if (search) {
        const text = `${item.user_email} ${item.user_name} ${item.ip_address} ${item.action}`.toLowerCase();
        if (!text.includes(search.toLowerCase())) continue;
      }
      parsed.push(item);
    } catch {}
  }

  const total = parsed.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = parsed.slice(startIndex, startIndex + limitNum);

  return {
    data: paginated,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

export default auditService;

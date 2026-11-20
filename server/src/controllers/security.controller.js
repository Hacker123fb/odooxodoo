import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import {
  blockIpManual,
  unblockIp,
  getAllBlockedIps,
  lockAccountManual,
  unlockAccount,
  getAllLockedAccounts
} from '../middleware/ipBlocker.js';
import { userModel } from '../models/userModel.js';
import auditService from '../services/audit.service.js';
import rollbackService from '../services/rollback.service.js';
import pool from '../config/db.js';

export const securityController = {
  /**
   * POST /api/v1/admin/security/revoke-ip
   * Immediately revokes platform access from a suspicious IP address
   */
  revokeIp: asyncHandler(async (req, res) => {
    const { ip, reason = 'Suspicious activity detected by Super Admin', durationMinutes = 1440 } = req.body;

    if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
      throw new AppError('Valid IP address is required to revoke access.', HttpStatusCodes.BAD_REQUEST);
    }

    const cleanIp = ip.trim();
    blockIpManual(cleanIp, reason, durationMinutes);

    auditService.logActionEvent({
      req,
      action: 'ADMIN_REVOKE_IP_ACCESS',
      status: 'SUCCESS',
      resourceType: 'ip_address',
      resourceId: cleanIp,
      details: {
        revokedIp: cleanIp,
        reason,
        durationMinutes,
        initiatedBy: req.user?.email || 'SUPER_ADMIN'
      }
    });

    return res.ok(
      { ip: cleanIp, durationMinutes, reason },
      `Access for IP ${cleanIp} has been immediately revoked.`
    );
  }),

  /**
   * POST /api/v1/admin/security/unblock-ip
   * Restores platform access for a previously blocked or revoked IP
   */
  restoreIp: asyncHandler(async (req, res) => {
    const { ip } = req.body;

    if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
      throw new AppError('Valid IP address is required to restore access.', HttpStatusCodes.BAD_REQUEST);
    }

    const cleanIp = ip.trim();
    unblockIp(cleanIp, true);

    auditService.logActionEvent({
      req,
      action: 'ADMIN_RESTORE_IP_ACCESS',
      status: 'SUCCESS',
      resourceType: 'ip_address',
      resourceId: cleanIp,
      details: {
        restoredIp: cleanIp,
        initiatedBy: req.user?.email || 'SUPER_ADMIN'
      }
    });

    return res.ok(
      { ip: cleanIp },
      `Access for IP ${cleanIp} has been restored successfully.`
    );
  }),

  /**
   * GET /api/v1/admin/security/blocked-ips
   * List all currently active IP bans / revocations
   */
  getBlockedIps: asyncHandler(async (req, res) => {
    const blocked = getAllBlockedIps();
    return res.ok(blocked, 'Active blocked and revoked IP addresses retrieved.');
  }),

  /**
   * POST /api/v1/admin/security/lock-account
   * Locks down a compromised or suspicious staff account for safety
   */
  lockAccount: asyncHandler(async (req, res) => {
    const { email, reason = 'Administrative safety lockdown', durationMinutes = 1440 } = req.body;

    if (!email || typeof email !== 'string') {
      throw new AppError('Target account email is required.', HttpStatusCodes.BAD_REQUEST);
    }

    const cleanEmail = email.toLowerCase().trim();
    const targetUser = await userModel.findByEmail(cleanEmail);

    if (!targetUser) {
      throw new AppError(`No account registered with email '${cleanEmail}'.`, HttpStatusCodes.NOT_FOUND);
    }

    // Protect the root Super Admin from self-lockout
    if (targetUser.role_name === 'SUPER_ADMIN' && targetUser.id === req.user.id) {
      throw new AppError('Root Super Admin account cannot be locked down.', HttpStatusCodes.FORBIDDEN);
    }

    // 1. Suspend in database
    await userModel.updateStatus(targetUser.id, 'SUSPENDED');

    // 2. Lockout in memory cache across all origins
    lockAccountManual(cleanEmail, reason, durationMinutes);

    auditService.logActionEvent({
      req,
      action: 'ADMIN_LOCK_ACCOUNT',
      status: 'SUCCESS',
      resourceType: 'user_account',
      resourceId: cleanEmail,
      details: {
        lockedUserEmail: cleanEmail,
        lockedUserId: targetUser.id,
        lockedUserName: targetUser.full_name,
        reason,
        durationMinutes,
        initiatedBy: req.user?.email || 'SUPER_ADMIN'
      }
    });

    return res.ok(
      { email: cleanEmail, status: 'SUSPENDED', reason },
      `Account ${cleanEmail} has been locked down for safety.`
    );
  }),

  /**
   * POST /api/v1/admin/security/unlock-account
   * Unlocks and restores an account to ACTIVE operational status
   */
  unlockAccount: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      throw new AppError('Target account email is required.', HttpStatusCodes.BAD_REQUEST);
    }

    const cleanEmail = email.toLowerCase().trim();
    const targetUser = await userModel.findByEmail(cleanEmail);

    if (!targetUser) {
      throw new AppError(`No account registered with email '${cleanEmail}'.`, HttpStatusCodes.NOT_FOUND);
    }

    // 1. Restore ACTIVE status in database
    await userModel.updateStatus(targetUser.id, 'ACTIVE');

    // 2. Clear memory lockout
    unlockAccount(cleanEmail, true);

    auditService.logActionEvent({
      req,
      action: 'ADMIN_UNLOCK_ACCOUNT',
      status: 'SUCCESS',
      resourceType: 'user_account',
      resourceId: cleanEmail,
      details: {
        unlockedUserEmail: cleanEmail,
        unlockedUserId: targetUser.id,
        unlockedUserName: targetUser.full_name,
        initiatedBy: req.user?.email || 'SUPER_ADMIN'
      }
    });

    return res.ok(
      { email: cleanEmail, status: 'ACTIVE' },
      `Account ${cleanEmail} has been unlocked and restored to ACTIVE status.`
    );
  }),

  /**
   * GET /api/v1/admin/security/locked-accounts
   * Retrieve all currently locked or suspended accounts
   */
  getLockedAccounts: asyncHandler(async (req, res) => {
    const [dbRows] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.last_login, u.created_at, u.updated_at, r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.status = 'SUSPENDED'
      ORDER BY u.updated_at DESC
    `);

    const memoryLocked = getAllLockedAccounts();
    const memoryEmailMap = new Map(memoryLocked.map(m => [m.email, m]));

    const combined = (dbRows || []).map(user => {
      const mem = memoryEmailMap.get(user.email);
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role_name: user.role_name,
        last_login: user.last_login,
        reason: mem?.reason || 'Administrative Security Lockdown',
        lockedAt: mem?.blockedAt || user.updated_at || user.created_at,
        remainingMinutes: mem?.remainingMinutes || null,
        formattedDuration: mem?.formattedDuration || 'Indefinite (Admin Lock)'
      };
    });

    return res.ok(combined, 'Locked accounts retrieved successfully.');
  }),

  /**
   * POST /api/v1/admin/security/rollback/:id
   * Rolls back a suspicious or malicious action to its previous state
   */
  rollbackAction: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await rollbackService.rollbackLogAction(id, req.user, req);
    return res.ok(result, result.message || 'Action state successfully rolled back.');
  })
};

export default securityController;

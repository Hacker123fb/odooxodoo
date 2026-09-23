import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

/**
 * Brute Force Defense Configuration
 */
const CONFIG = {
  MAX_FAILED_LOGINS: 5,               // Block after 5 failed attempts
  FAILED_WINDOW_MS: 15 * 60 * 1000,   // Window: 15 minutes
  LOGIN_BLOCK_MS: 60 * 60 * 1000,     // Block duration: 1 hour
  
  MAX_ATTACK_STRIKES: 3,              // Block after 3 malicious payloads
  ATTACK_BLOCK_MS: 24 * 60 * 60 * 1000 // Block duration: 24 hours
};

// Maps to track active state
const failedLoginsMap = new Map(); // ip -> { count, windowStart }
const attackStrikesMap = new Map(); // ip -> { count, windowStart }
const blockedIpsMap = new Map();   // ip -> { blockedUntil, reason, blockedAt }

/**
 * Check if an IP address is currently blocked
 * Automatically unblocks expired records
 */
export const isIpBlocked = (ip) => {
  if (!ip) return false;
  const blockRecord = blockedIpsMap.get(ip);
  if (!blockRecord) return false;

  const now = Date.now();
  if (now > blockRecord.blockedUntil) {
    // Block duration has expired
    blockedIpsMap.delete(ip);
    failedLoginsMap.delete(ip);
    attackStrikesMap.delete(ip);
    console.log(`[SECURITY] IP block expired for: ${ip}`);
    return false;
  }

  return true;
};

/**
 * Get remaining block time in minutes and block details
 */
export const getBlockDetails = (ip) => {
  const record = blockedIpsMap.get(ip);
  if (!record) return null;
  const remainingMs = Math.max(0, record.blockedUntil - Date.now());
  return {
    reason: record.reason,
    blockedAt: new Date(record.blockedAt).toISOString(),
    remainingMinutes: Math.ceil(remainingMs / (60 * 1000))
  };
};

/**
 * Manually block an IP
 */
export const blockIp = (ip, reason, durationMs = CONFIG.LOGIN_BLOCK_MS) => {
  const now = Date.now();
  blockedIpsMap.set(ip, {
    blockedAt: now,
    blockedUntil: now + durationMs,
    reason
  });
  console.warn(`[SECURITY] [BLOCK] IP ${ip} has been BLOCKED for ${Math.round(durationMs / 60000)} minutes. Reason: ${reason}`);
};

/**
 * Manually unblock an IP
 */
export const unblockIp = (ip) => {
  blockedIpsMap.delete(ip);
  failedLoginsMap.delete(ip);
  attackStrikesMap.delete(ip);
  console.log(`[SECURITY] IP manually unblocked: ${ip}`);
};

/**
 * Record a failed authentication attempt
 */
export const recordFailedLogin = (ip) => {
  if (!ip) return;
  const now = Date.now();
  const entry = failedLoginsMap.get(ip) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - entry.windowStart > CONFIG.FAILED_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }

  failedLoginsMap.set(ip, entry);
  console.warn(`[SECURITY] Failed login recorded for IP ${ip} (${entry.count}/${CONFIG.MAX_FAILED_LOGINS})`);

  if (entry.count >= CONFIG.MAX_FAILED_LOGINS) {
    blockIp(ip, 'BRUTE_FORCE_FAILED_LOGINS', CONFIG.LOGIN_BLOCK_MS);
  }
};

/**
 * Record a failed OTP verification attempt
 */
export const recordFailedOtp = (ip) => {
  if (!ip) return;
  const now = Date.now();
  const entry = failedLoginsMap.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > CONFIG.FAILED_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }

  failedLoginsMap.set(ip, entry);
  console.warn(`[SECURITY] Failed OTP attempt recorded for IP ${ip} (${entry.count}/${CONFIG.MAX_FAILED_LOGINS})`);

  if (entry.count >= CONFIG.MAX_FAILED_LOGINS) {
    blockIp(ip, 'BRUTE_FORCE_FAILED_OTP', CONFIG.LOGIN_BLOCK_MS);
  }
};

/**
 * Record an exploit strike (e.g. SQL injection payload)
 */
export const recordAttackStrike = (ip, reason = 'EXPLOIT_PAYLOAD') => {
  if (!ip) return;
  const now = Date.now();
  const entry = attackStrikesMap.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > CONFIG.FAILED_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count += 1;
  }

  attackStrikesMap.set(ip, entry);
  console.warn(`[SECURITY] [ATTACK STRIKE] Strike against IP ${ip} (${entry.count}/${CONFIG.MAX_ATTACK_STRIKES}): ${reason}`);

  if (entry.count >= CONFIG.MAX_ATTACK_STRIKES) {
    blockIp(ip, `ATTACK_STRIKES_EXCEEDED: ${reason}`, CONFIG.ATTACK_BLOCK_MS);
  }
};

/**
 * Record a successful login - clears failed counters
 */
export const recordSuccessfulLogin = (ip) => {
  if (!ip) return;
  failedLoginsMap.delete(ip);
};

/**
 * IP Blocker Guard Middleware
 * Rejects requests from blocked IPs with HTTP 403 Forbidden
 */
export const ipBlocker = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

  if (isIpBlocked(clientIp)) {
    const details = getBlockDetails(clientIp);
    const mins = details ? details.remainingMinutes : 60;
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      success: false,
      message: `Access Denied: Your IP address (${clientIp}) has been temporarily blocked due to repeated failed login attempts or suspicious activity. Block expires in ${mins} minute(s).`,
      code: 'IP_BLOCKED',
      reason: details?.reason || 'BRUTE_FORCE_PREVENTION',
      remainingMinutes: mins
    });
  }

  next();
};

// Periodic garbage collection for memory hygiene
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of blockedIpsMap.entries()) {
    if (now > entry.blockedUntil) {
      blockedIpsMap.delete(ip);
      failedLoginsMap.delete(ip);
      attackStrikesMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export default ipBlocker;

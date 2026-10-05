import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

/**
 * Progressive Escalation Defense Configuration
 * Tier 1: 15 minutes
 * Tier 2: 60 minutes (1 hour)
 * Tier 3: 4 hours
 * Tier 4: 24 hours
 */
const ESCALATION_DURATIONS_MS = [
  15 * 60 * 1000,        // 15 mins
  60 * 60 * 1000,        // 60 mins (1 hr)
  4 * 60 * 60 * 1000,    // 4 hours
  24 * 60 * 60 * 1000    // 24 hours
];

const CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,             // Lock after 5 failed attempts
  FAILED_WINDOW_MS: 15 * 60 * 1000,   // Sliding window: 15 minutes
  HISTORY_RETENTION_MS: 72 * 60 * 60 * 1000 // Remember lockout tier for 72 hours
};

// Maps to track IP states
const ipFailedLoginsMap = new Map();  // ip -> { count, windowStart }
const ipBlockedMap = new Map();       // ip -> { blockedUntil, reason, blockedAt, tier }
const ipHistoryMap = new Map();       // ip -> { tier, lastBlockedAt }

// Maps to track Account (Email) states - ANTI-IP-HOPPING DEFENSE
const accountFailedLoginsMap = new Map(); // email -> { count, windowStart, ips: Set }
const accountBlockedMap = new Map();      // email -> { blockedUntil, reason, blockedAt, tier }
const accountHistoryMap = new Map();      // email -> { tier, lastBlockedAt }

/**
 * Robust extraction of true client IP address behind reverse proxies (Render, Cloudflare, Nginx)
 */
export const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
  if (xForwardedFor) {
    const raw = typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0].trim()
      : xForwardedFor[0]?.trim();
    if (raw) return raw.replace(/^::ffff:/, '');
  }
  const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  return ip.replace(/^::ffff:/, '');
};

/**
 * Checks if an IP is exempted from IP blocking.
 * Strict Mode: By default, ALL IPs (including localhost/local dev) are strictly defended.
 * An environment override BYPASS_LOCAL_IP_BLOCKING=true can be provided if needed.
 */
export const isPrivateOrLoopbackIp = (ip) => {
  if (!ip) return false;
  if (process.env.BYPASS_LOCAL_IP_BLOCKING === 'true') {
    const cleanIp = ip.replace(/^::ffff:/, '').trim();
    return (
      cleanIp === '127.0.0.1' ||
      cleanIp === '::1' ||
      cleanIp === 'localhost'
    );
  }
  return false;
};

/**
 * Returns escalation duration in milliseconds based on current tier index
 */
const getTierDuration = (tierIndex) => {
  const index = Math.min(Math.max(0, tierIndex), ESCALATION_DURATIONS_MS.length - 1);
  return ESCALATION_DURATIONS_MS[index];
};

/**
 * Formats duration in human-readable minutes/hours
 */
const formatDurationDesc = (ms) => {
  const mins = Math.ceil(ms / (60 * 1000));
  if (mins >= 60) {
    const hrs = Math.ceil(mins / 60);
    return `${hrs} hour(s)`;
  }
  return `${mins} minute(s)`;
};

// ============================================================================
// 1. IP-LEVEL BRUTE FORCE DEFENSE
// ============================================================================

export const isIpBlocked = (ip) => {
  if (!ip || isPrivateOrLoopbackIp(ip)) return false;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  const blockRecord = ipBlockedMap.get(cleanIp);
  if (!blockRecord) return false;

  const now = Date.now();
  if (now > blockRecord.blockedUntil) {
    ipBlockedMap.delete(cleanIp);
    ipFailedLoginsMap.delete(cleanIp);
    console.log(`[SECURITY] IP block cooldown expired for: ${cleanIp}`);
    return false;
  }

  return true;
};

export const getBlockDetails = (ip) => {
  if (!ip || isPrivateOrLoopbackIp(ip)) return null;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  const record = ipBlockedMap.get(cleanIp);
  if (!record) return null;
  const remainingMs = Math.max(0, record.blockedUntil - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  return {
    reason: record.reason,
    blockedAt: new Date(record.blockedAt).toISOString(),
    blockedUntil: record.blockedUntil,
    remainingMinutes,
    remainingSeconds,
    tier: (record.tier || 0) + 1,
    formattedDuration: formatDurationDesc(remainingMs)
  };
};

export const blockIpProgressive = (ip, reason = 'BRUTE_FORCE_FAILED_LOGINS') => {
  if (!ip || isPrivateOrLoopbackIp(ip)) return;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  const now = Date.now();
  const history = ipHistoryMap.get(cleanIp) || { tier: 0, lastBlockedAt: 0 };

  // Reset escalation tier if previous block was more than 72 hours ago
  if (now - history.lastBlockedAt > CONFIG.HISTORY_RETENTION_MS) {
    history.tier = 0;
  }

  const durationMs = getTierDuration(history.tier);
  const currentTier = history.tier + 1;

  ipBlockedMap.set(cleanIp, {
    blockedAt: now,
    blockedUntil: now + durationMs,
    reason,
    tier: history.tier
  });

  // Advance tier for next potential lockout (capped at 24 hours)
  history.tier = Math.min(history.tier + 1, ESCALATION_DURATIONS_MS.length - 1);
  history.lastBlockedAt = now;
  ipHistoryMap.set(cleanIp, history);

  console.warn(`[SECURITY] [IP BLOCK] IP ${cleanIp} has been BLOCKED (Tier ${currentTier}: ${formatDurationDesc(durationMs)}). Reason: ${reason}`);
};

export const unblockIp = (ip, resetHistory = true) => {
  if (!ip) return;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  ipBlockedMap.delete(cleanIp);
  ipFailedLoginsMap.delete(cleanIp);
  if (resetHistory) {
    ipHistoryMap.delete(cleanIp);
  }
  console.log(`[SECURITY] IP active block cleared: ${cleanIp}`);
};

export const unblockAll = () => {
  ipBlockedMap.clear();
  ipFailedLoginsMap.clear();
  ipHistoryMap.clear();
  accountBlockedMap.clear();
  accountFailedLoginsMap.clear();
  accountHistoryMap.clear();
  console.log('[SECURITY] All IP and account blocks forcefully reset.');
};

// ============================================================================
// 2. ACCOUNT-LEVEL DEFENSE (ANTI-IP-HOPPING / DISTRIBUTED BRUTE FORCE)
// ============================================================================

export const isAccountLocked = (email) => {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const blockRecord = accountBlockedMap.get(cleanEmail);
  if (!blockRecord) return false;

  const now = Date.now();
  if (now > blockRecord.blockedUntil) {
    accountBlockedMap.delete(cleanEmail);
    accountFailedLoginsMap.delete(cleanEmail);
    console.log(`[SECURITY] Account lockout cooldown expired for: ${cleanEmail}`);
    return false;
  }

  return true;
};

export const getAccountLockDetails = (email) => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const record = accountBlockedMap.get(cleanEmail);
  if (!record) return null;

  const remainingMs = Math.max(0, record.blockedUntil - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  return {
    email: cleanEmail,
    reason: record.reason,
    remainingMinutes,
    tier: (record.tier || 0) + 1,
    formattedDuration: formatDurationDesc(remainingMs)
  };
};

export const lockAccountProgressive = (email, reason = 'DISTRIBUTED_BRUTE_FORCE_ATTEMPTS') => {
  const cleanEmail = email.toLowerCase().trim();
  const now = Date.now();
  const history = accountHistoryMap.get(cleanEmail) || { tier: 0, lastBlockedAt: 0 };

  if (now - history.lastBlockedAt > CONFIG.HISTORY_RETENTION_MS) {
    history.tier = 0;
  }

  const durationMs = getTierDuration(history.tier);
  const currentTier = history.tier + 1;

  accountBlockedMap.set(cleanEmail, {
    blockedAt: now,
    blockedUntil: now + durationMs,
    reason,
    tier: history.tier
  });

  history.tier = Math.min(history.tier + 1, ESCALATION_DURATIONS_MS.length - 1);
  history.lastBlockedAt = now;
  accountHistoryMap.set(cleanEmail, history);

  console.warn(`[SECURITY] [ACCOUNT LOCKOUT] Account ${cleanEmail} LOCKED (Tier ${currentTier}: ${formatDurationDesc(durationMs)}) across origins.`);
};

export const unlockAccount = (email, resetHistory = true) => {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  accountBlockedMap.delete(cleanEmail);
  accountFailedLoginsMap.delete(cleanEmail);
  if (resetHistory) {
    accountHistoryMap.delete(cleanEmail);
  }
  console.log(`[SECURITY] Account active lockout cleared: ${cleanEmail}`);
};

// ============================================================================
// 3. EVENT RECORDING HANDLERS
// ============================================================================

export const recordFailedLogin = (ip, email = null) => {
  const now = Date.now();
  const cleanIp = ip ? ip.replace(/^::ffff:/, '').trim() : null;

  // 1. Record on IP (never track or block loopback/internal proxy IPs)
  if (cleanIp && !isPrivateOrLoopbackIp(cleanIp)) {
    const ipEntry = ipFailedLoginsMap.get(cleanIp) || { count: 0, windowStart: now };
    if (now - ipEntry.windowStart > CONFIG.FAILED_WINDOW_MS) {
      ipEntry.count = 1;
      ipEntry.windowStart = now;
    } else {
      ipEntry.count += 1;
    }
    ipFailedLoginsMap.set(cleanIp, ipEntry);
    console.warn(`[SECURITY] Failed login for IP ${cleanIp} (${ipEntry.count}/${CONFIG.MAX_FAILED_ATTEMPTS})`);

    if (ipEntry.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
      blockIpProgressive(cleanIp, 'BRUTE_FORCE_FAILED_LOGINS');
    }
  }

  // 2. Record on Account (Regardless of what IP was used)
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const acctEntry = accountFailedLoginsMap.get(cleanEmail) || { count: 0, windowStart: now, ips: new Set() };
    if (now - acctEntry.windowStart > CONFIG.FAILED_WINDOW_MS) {
      acctEntry.count = 1;
      acctEntry.windowStart = now;
      acctEntry.ips = new Set(cleanIp ? [cleanIp] : []);
    } else {
      acctEntry.count += 1;
      if (cleanIp) acctEntry.ips.add(cleanIp);
    }
    accountFailedLoginsMap.set(cleanEmail, acctEntry);
    console.warn(`[SECURITY] Failed login for Account ${cleanEmail} (${acctEntry.count}/${CONFIG.MAX_FAILED_ATTEMPTS}) from ${acctEntry.ips.size} IP(s)`);

    if (acctEntry.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
      lockAccountProgressive(cleanEmail, `FAILED_ATTEMPTS_EXCEEDED_ACROSS_${acctEntry.ips.size}_IPS`);
    }
  }
};

export const recordFailedOtp = (ip, email = null) => {
  recordFailedLogin(ip, email);
};

export const recordSuccessfulLogin = (ip, email = null) => {
  const cleanIp = ip ? ip.replace(/^::ffff:/, '').trim() : null;
  if (cleanIp) {
    ipFailedLoginsMap.delete(cleanIp);
  }
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    accountFailedLoginsMap.delete(cleanEmail);
  }
};

export const recordAttackStrike = (ip, reason = 'MALICIOUS_ATTACK_STRIKE') => {
  if (!ip || isPrivateOrLoopbackIp(ip)) return;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  console.warn(`[SECURITY] Attack strike recorded for IP ${cleanIp}: ${reason}`);
  blockIpProgressive(cleanIp, reason);
};

// ============================================================================
// 4. IP BLOCKER MIDDLEWARE GUARD
// ============================================================================

export const ipBlocker = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const clientIp = getClientIp(req);

  // Allow essential status and unblock endpoints to pass through unconditionally
  const requestPath = (req.path || '').toLowerCase();
  if (
    requestPath.endsWith('/auth/ip-status') ||
    requestPath.endsWith('/auth/unblock') ||
    requestPath.endsWith('/health/ping') ||
    requestPath.endsWith('/health') ||
    requestPath === '/api/v1/auth/ip-status' ||
    requestPath === '/api/v1/auth/unblock'
  ) {
    return next();
  }

  if (isIpBlocked(clientIp)) {
    const details = getBlockDetails(clientIp);
    const mins = details ? details.remainingMinutes : 15;
    const remainingSeconds = details ? details.remainingSeconds : mins * 60;
    const blockedUntil = details?.blockedUntil || (Date.now() + mins * 60 * 1000);
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      success: false,
      blocked: true,
      message: `You have tried too many times. Your IP is blocked for ${details?.formattedDuration || `${mins} min`}. Please try again later.`,
      code: 'IP_BLOCKED',
      reason: details?.reason || 'BRUTE_FORCE_PREVENTION',
      remainingMinutes: mins,
      remainingSeconds,
      blockedUntil,
      tier: details?.tier || 1
    });
  }

  next();
};

// Periodic garbage collection for memory hygiene
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipBlockedMap.entries()) {
    if (now > entry.blockedUntil) {
      ipBlockedMap.delete(ip);
      ipFailedLoginsMap.delete(ip);
    }
  }
  for (const [email, entry] of accountBlockedMap.entries()) {
    if (now > entry.blockedUntil) {
      accountBlockedMap.delete(email);
      accountFailedLoginsMap.delete(email);
    }
  }
}, 10 * 60 * 1000);

export default ipBlocker;

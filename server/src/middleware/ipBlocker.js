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
// Prevents attackers from rotating proxy/VPN IPs while targeting the same account!
const accountFailedLoginsMap = new Map(); // email -> { count, windowStart, ips: Set }
const accountBlockedMap = new Map();      // email -> { blockedUntil, reason, blockedAt, tier }
const accountHistoryMap = new Map();      // email -> { tier, lastBlockedAt }

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
  if (!ip) return false;
  const blockRecord = ipBlockedMap.get(ip);
  if (!blockRecord) return false;

  const now = Date.now();
  if (now > blockRecord.blockedUntil) {
    ipBlockedMap.delete(ip);
    ipFailedLoginsMap.delete(ip);
    console.log(`[SECURITY] IP block cooldown expired for: ${ip}`);
    return false;
  }

  return true;
};

export const getBlockDetails = (ip) => {
  const record = ipBlockedMap.get(ip);
  if (!record) return null;
  const remainingMs = Math.max(0, record.blockedUntil - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  return {
    reason: record.reason,
    blockedAt: new Date(record.blockedAt).toISOString(),
    remainingMinutes,
    tier: (record.tier || 0) + 1,
    formattedDuration: formatDurationDesc(remainingMs)
  };
};

export const blockIpProgressive = (ip, reason = 'BRUTE_FORCE_FAILED_LOGINS') => {
  const now = Date.now();
  const history = ipHistoryMap.get(ip) || { tier: 0, lastBlockedAt: 0 };

  // Reset escalation tier if previous block was more than 72 hours ago
  if (now - history.lastBlockedAt > CONFIG.HISTORY_RETENTION_MS) {
    history.tier = 0;
  }

  const durationMs = getTierDuration(history.tier);
  const currentTier = history.tier + 1;

  ipBlockedMap.set(ip, {
    blockedAt: now,
    blockedUntil: now + durationMs,
    reason,
    tier: history.tier
  });

  // Advance tier for next potential lockout (capped at 24 hours)
  history.tier = Math.min(history.tier + 1, ESCALATION_DURATIONS_MS.length - 1);
  history.lastBlockedAt = now;
  ipHistoryMap.set(ip, history);

  console.warn(`[SECURITY] [IP BLOCK] IP ${ip} has been BLOCKED (Tier ${currentTier}: ${formatDurationDesc(durationMs)}). Reason: ${reason}`);
};

export const unblockIp = (ip, resetHistory = false) => {
  ipBlockedMap.delete(ip);
  ipFailedLoginsMap.delete(ip);
  if (resetHistory) {
    ipHistoryMap.delete(ip);
  }
  console.log(`[SECURITY] IP active block cleared: ${ip} (History reset: ${resetHistory})`);
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

export const unlockAccount = (email, resetHistory = false) => {
  const cleanEmail = email.toLowerCase().trim();
  accountBlockedMap.delete(cleanEmail);
  accountFailedLoginsMap.delete(cleanEmail);
  if (resetHistory) {
    accountHistoryMap.delete(cleanEmail);
  }
  console.log(`[SECURITY] Account active lockout cleared: ${cleanEmail} (History reset: ${resetHistory})`);
};

// ============================================================================
// 3. EVENT RECORDING HANDLERS
// ============================================================================

export const recordFailedLogin = (ip, email = null) => {
  const now = Date.now();

  // 1. Record on IP
  if (ip) {
    const ipEntry = ipFailedLoginsMap.get(ip) || { count: 0, windowStart: now };
    if (now - ipEntry.windowStart > CONFIG.FAILED_WINDOW_MS) {
      ipEntry.count = 1;
      ipEntry.windowStart = now;
    } else {
      ipEntry.count += 1;
    }
    ipFailedLoginsMap.set(ip, ipEntry);
    console.warn(`[SECURITY] Failed login for IP ${ip} (${ipEntry.count}/${CONFIG.MAX_FAILED_ATTEMPTS})`);

    if (ipEntry.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
      blockIpProgressive(ip, 'BRUTE_FORCE_FAILED_LOGINS');
    }
  }

  // 2. Record on Account (Regardless of what IP was used!)
  // If an attacker switches IP 5 times while targeting the same email, this triggers!
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    const acctEntry = accountFailedLoginsMap.get(cleanEmail) || { count: 0, windowStart: now, ips: new Set() };
    if (now - acctEntry.windowStart > CONFIG.FAILED_WINDOW_MS) {
      acctEntry.count = 1;
      acctEntry.windowStart = now;
      acctEntry.ips = new Set(ip ? [ip] : []);
    } else {
      acctEntry.count += 1;
      if (ip) acctEntry.ips.add(ip);
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
  if (ip) {
    ipFailedLoginsMap.delete(ip);
  }
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    accountFailedLoginsMap.delete(cleanEmail);
  }
};

// ============================================================================
// 4. IP BLOCKER MIDDLEWARE GUARD
// ============================================================================

export const ipBlocker = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

  if (isIpBlocked(clientIp)) {
    const details = getBlockDetails(clientIp);
    const mins = details ? details.remainingMinutes : 15;
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      success: false,
      message: `You have tried too many times. Your IP is blocked for ${details?.formattedDuration || `${mins} min`}. Please try again later.`,
      code: 'IP_BLOCKED',
      reason: details?.reason || 'BRUTE_FORCE_PREVENTION',
      remainingMinutes: mins,
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

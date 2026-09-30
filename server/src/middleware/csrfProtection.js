import crypto from 'crypto';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';

// Cryptographic secret for signing CSRF tokens in memory
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

// In-memory token store with expiry for high-security one-time/rotating CSRF validation
const activeCsrfTokens = new Map(); // token -> expiresAt
const TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Generates a cryptographically secure HMAC-signed CSRF token
 */
export const generateCsrfToken = () => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${nonce}:${timestamp}`)
    .digest('hex');

  const token = `${nonce}.${timestamp}.${signature}`;
  activeCsrfTokens.set(token, timestamp + TOKEN_LIFETIME_MS);
  return token;
};

/**
 * Validates a CSRF token structure and HMAC signature
 */
export const verifyCsrfToken = (token) => {
  if (!token || typeof token !== 'string') return false;

  // 1. Must exist in active issued tokens registry
  if (!activeCsrfTokens.has(token)) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [nonce, timestampStr, signature] = parts;

  // 2. Strict format and character length validation
  if (!/^[0-9a-f]{32}$/i.test(nonce)) return false;
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // 3. Check expiration
  if (Date.now() - timestamp > TOKEN_LIFETIME_MS) {
    activeCsrfTokens.delete(token);
    return false;
  }

  // 4. Verify HMAC signature with timing-safe comparison
  const expectedSig = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${nonce}:${timestamp}`)
    .digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
};

/**
 * Periodic cleanup of expired CSRF tokens
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of activeCsrfTokens.entries()) {
    if (now > expiresAt) {
      activeCsrfTokens.delete(token);
    }
  }
}, 15 * 60 * 1000);

/**
 * Approved origin patterns (supports local dev, Vercel, Render, and configured client URL)
 */
const isApprovedOrigin = (origin) => {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();

    // 1. Local development
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return true;
    }

    // 2. Vercel cloud platform domains (*.vercel.app)
    if (host === 'vercel.app' || host.endsWith('.vercel.app')) {
      return true;
    }

    // 3. Render cloud platform domains (*.onrender.com)
    if (host === 'onrender.com' || host.endsWith('.onrender.com')) {
      return true;
    }

    // 4. Environment-specified client URL
    if (process.env.CLIENT_URL) {
      try {
        const clientUrlHost = new URL(process.env.CLIENT_URL).hostname.toLowerCase();
        if (host === clientUrlHost) return true;
      } catch {}
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Enterprise CSRF Protection Middleware
 * 
 * Protects all state-changing HTTP requests against Cross-Site Request Forgery:
 * - Public auth entrypoints establish new sessions and are safely excluded from CSRF checks.
 * - Authenticated requests bearing a JWT Bearer header or custom AJAX header (X-Requested-With)
 *   are verified, ensuring unauthorized external websites cannot forge requests.
 */
export const csrfProtection = (req, res, next) => {
  // 1. Safe HTTP methods (GET, HEAD, OPTIONS) do not alter server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    return next();
  }

  // 2. Exclude public authentication endpoints that establish session
  const path = (req.path || '').toLowerCase();
  const isAuthEntry = path.endsWith('/auth/login') || 
                      path.endsWith('/auth/register') || 
                      path.endsWith('/auth/verify-otp') || 
                      path.endsWith('/auth/resend-otp') || 
                      path.endsWith('/auth/forgot-password') || 
                      path.endsWith('/auth/reset-password') ||
                      path.endsWith('/auth/ip-status') ||
                      path.endsWith('/auth/unblock') ||
                      path.endsWith('/health') ||
                      path.endsWith('/health/ping');

  if (isAuthEntry) {
    return next();
  }

  // 3. Strict Origin & Referer Validation
  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  if (origin) {
    if (!isApprovedOrigin(origin)) {
      console.warn(`[SECURITY] [CSRF BLOCK] Disallowed Origin detected: ${origin} on ${req.method} ${req.originalUrl}`);
      return res.status(HttpStatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Security Alert: Cross-Site Request Forgery detected. Request origin is not permitted.',
        code: 'CSRF_ORIGIN_REJECTED'
      });
    }
  } else if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!isApprovedOrigin(refererOrigin)) {
        console.warn(`[SECURITY] [CSRF BLOCK] Disallowed Referer detected: ${referer} on ${req.method} ${req.originalUrl}`);
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          message: 'Security Alert: Cross-Site Request Forgery detected. Request referer is not permitted.',
          code: 'CSRF_REFERER_REJECTED'
        });
      }
    } catch {}
  }

  // 4. Custom Header Verification (X-Requested-With OR X-CSRF-Token OR Bearer Authorization)
  const requestedWith = req.headers['x-requested-with'];
  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];

  const hasAjaxHeader = requestedWith && requestedWith.toLowerCase() === 'xmlhttprequest';
  const hasValidToken = csrfToken && verifyCsrfToken(csrfToken);
  const hasAuthBearer = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');

  if (!hasAjaxHeader && !hasValidToken && !hasAuthBearer) {
    console.warn(`[SECURITY] [CSRF BLOCK] Missing anti-forgery proof on ${req.method} ${req.originalUrl}`);
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Security Alert: Cross-Site Request Forgery verification failed. Missing anti-forgery token or headers.',
      code: 'CSRF_VERIFICATION_FAILED'
    });
  }

  next();
};

export default csrfProtection;

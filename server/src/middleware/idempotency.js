import crypto from 'crypto';

/**
 * Enterprise Idempotency Middleware
 * Prevents duplicate database entries and side effects caused by rapid button clicks,
 * network retries, or duplicate submission payloads.
 */
const idempotencyStore = new Map(); // key -> { status: 'PROCESSING' | 'COMPLETED', statusCode, body, timestamp }
const IDEMPOTENCY_TTL_MS = 2 * 60 * 1000; // 2 minutes TTL

// Periodic memory garbage collection every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 1000).unref();

export const idempotencyMiddleware = (req, res, next) => {
  // Only apply idempotency to mutating requests (POST, PUT, DELETE)
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return next();
  }

  // Exempt auth authentication queries like login / ip-status / csrf / verify-signature
  const isExempt = req.originalUrl.includes('/auth/login') ||
                   req.originalUrl.includes('/auth/ip-status') ||
                   req.originalUrl.includes('/auth/csrf') ||
                   req.originalUrl.includes('/auth/verify-security-signature');
  if (isExempt) {
    return next();
  }

  // Extract or generate idempotency key
  let idempotencyKey = req.headers['idempotency-key'] || 
                       req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    // Generate deterministic fingerprint based on user/IP, method, URL, and body
    const userIdentifier = req.user?.id || req.ip || 'anonymous';
    const bodyString = JSON.stringify(req.body || {});
    idempotencyKey = crypto
      .createHash('sha256')
      .update(`${userIdentifier}:${method}:${req.originalUrl}:${bodyString}`)
      .digest('hex');
  }

  const existing = idempotencyStore.get(idempotencyKey);
  const now = Date.now();

  if (existing && (now - existing.timestamp < IDEMPOTENCY_TTL_MS)) {
    if (existing.status === 'PROCESSING') {
      // Duplicate in flight! Reject or ignore to prevent race condition duplicate inserts in DB
      return res.status(409).json({
        success: false,
        message: 'A duplicate request is already being processed. Operation deduplicated.',
        code: 'DUPLICATE_REQUEST_IN_FLIGHT'
      });
    }

    if (existing.status === 'COMPLETED') {
      // Replay stored authoritative response without repeating the SQL insertion!
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(existing.statusCode).json(existing.body);
    }
  }

  // Mark this key as PROCESSING
  idempotencyStore.set(idempotencyKey, {
    status: 'PROCESSING',
    timestamp: now
  });

  // Intercept response to store result
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(idempotencyKey, {
        status: 'COMPLETED',
        statusCode: res.statusCode,
        body,
        timestamp: Date.now()
      });
    } else {
      // On error, remove so user can correct and retry
      idempotencyStore.delete(idempotencyKey);
    }
    return originalJson(body);
  };

  next();
};

export default idempotencyMiddleware;

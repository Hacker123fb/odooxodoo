/**
 * In-Memory High Performance API Cache Middleware
 * Dramatically accelerates repeated API responses with automatic cache invalidation
 * on data mutations (POST, PUT, PATCH, DELETE).
 */

const cacheStore = new Map(); // key -> { data, contentType, statusCode, expiresAt }
const DEFAULT_TTL_MS = 45 * 1000; // 45 seconds cache

/**
 * Generate a deterministic cache key for a request
 */
const getCacheKey = (req) => {
  const url = req.originalUrl || req.url;
  // If authenticated, isolate cache per user token so user-specific data is safe
  const authHeader = req.headers['authorization'] || '';
  const userSegment = authHeader ? authHeader.slice(-16) : 'public';
  return `${userSegment}:${url}`;
};

/**
 * Invalidate cached entries matching a prefix or resource pattern
 */
export const invalidateCache = (resourcePrefix) => {
  if (!resourcePrefix) {
    cacheStore.clear();
    return;
  }
  const cleanPrefix = resourcePrefix.replace(/^\/api\/v1\//, '').replace(/^\//, '');
  for (const key of cacheStore.keys()) {
    if (key.includes(cleanPrefix) || key.includes('dashboard') || key.includes('reports')) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Global In-Memory API Cache Middleware
 */
export const apiCache = (ttlMs = DEFAULT_TTL_MS) => {
  return (req, res, next) => {
    // 1. Only cache safe idempotent GET requests
    if (req.method !== 'GET') {
      // If mutation occurs (POST, PUT, PATCH, DELETE), clear matching cache after response completes
      const originalEnd = res.end;
      res.end = function (...args) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cleanPath = req.path.replace(/^\/api\/v1\//, '').replace(/^\//, '');
          const resource = cleanPath.split('/')[0] || '';
          invalidateCache(resource);
          invalidateCache('dashboard');
          invalidateCache('reports');
        }
        return originalEnd.apply(this, args);
      };
      return next();
    }

    // Skip cache for auth status, pending approvals, notifications, or health checks
    const url = req.originalUrl || req.url;
    if (
      url.includes('/auth/') ||
      url.includes('/health') ||
      url.includes('/notifications') ||
      req.headers['cache-control'] === 'no-cache'
    ) {
      return next();
    }

    const key = getCacheKey(req);
    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', cached.contentType || 'application/json');
      return res.status(cached.statusCode || 200).send(cached.data);
    }

    // Intercept response to store in cache
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: JSON.stringify(body),
          contentType: 'application/json',
          statusCode: res.statusCode,
          expiresAt: Date.now() + ttlMs
        });
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

// Periodic garbage collection for expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now >= entry.expiresAt) {
      cacheStore.delete(key);
    }
  }
}, 60 * 1000);

export default apiCache;

import { getCache, setCache, deleteCache, isRedisReady } from '../config/redis.js';

/**
 * Enterprise API Cache Middleware (Redis + In-Memory Fallback)
 * Accelerates repeated GET queries with sub-millisecond response latency.
 * Automatically invalidates matching caches on mutations (POST, PUT, PATCH, DELETE).
 */

const DEFAULT_TTL_SECONDS = 45;

/**
 * Generate a deterministic cache key for a request
 */
const getCacheKey = (req) => {
  const url = req.originalUrl || req.url;
  const authHeader = req.headers['authorization'] || '';
  const userSegment = authHeader ? authHeader.slice(-16) : 'public';
  return `api:${userSegment}:${url}`;
};

/**
 * Invalidate cached entries matching a prefix or resource pattern
 */
export const invalidateCache = async (resourcePrefix) => {
  if (!resourcePrefix) {
    await deleteCache('');
    return;
  }
  const cleanPrefix = resourcePrefix.replace(/^\/api\/v1\//, '').replace(/^\//, '');
  await Promise.all([
    deleteCache(cleanPrefix),
    deleteCache('dashboard'),
    deleteCache('reports')
  ]);
};

/**
 * Global API Cache Middleware
 */
export const apiCache = (ttlSeconds = DEFAULT_TTL_SECONDS) => {
  return async (req, res, next) => {
    // 1. Only cache safe GET requests
    if (req.method !== 'GET') {
      const originalEnd = res.end;
      res.end = function (...args) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cleanPath = req.path.replace(/^\/api\/v1\//, '').replace(/^\//, '');
          const resource = cleanPath.split('/')[0] || '';
          invalidateCache(resource).catch(() => {});
        }
        return originalEnd.apply(this, args);
      };
      return next();
    }

    // Skip cache for auth status, notifications, health checks, or explicit no-cache headers
    const url = req.originalUrl || req.url;
    if (
      url.includes('/auth/') ||
      url.includes('/health') ||
      url.includes('/notifications') ||
      url.includes('/admin/audit-logs') ||
      req.headers['cache-control'] === 'no-cache'
    ) {
      return next();
    }

    const key = getCacheKey(req);

    try {
      const cached = await getCache(key);
      if (cached) {
        res.setHeader('X-Cache', isRedisReady() ? 'HIT-REDIS' : 'HIT-MEMORY');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(cached);
      }
    } catch (err) {
      // On cache read error, proceed to live execution
    }

    // Intercept response to store in cache on MISS
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

export default apiCache;

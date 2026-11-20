import Redis from 'ioredis';

/**
 * Enterprise Redis Client Configuration with In-Memory Resilient Fallback
 * Provides ultra-fast caching across microservices and cluster nodes.
 * Automatically falls back to high-speed in-memory store if Redis is unavailable.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;
let isConnected = false;
let hasLoggedFailure = false;

// In-Memory Fallback Cache Store
const memoryFallbackStore = new Map();

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop reconnecting after 3 attempts
      }
      return Math.min(times * 200, 1000);
    }
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('[REDIS] Connected to Redis cluster cache at:', REDIS_URL.replace(/:[^:@]+@/, ':***@'));
  });

  redisClient.on('ready', () => {
    isConnected = true;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    if (!hasLoggedFailure) {
      console.warn(`[REDIS] [NOTICE] Redis server offline or unreachable (${err.message}). Seamlessly activated in-memory cache fallback.`);
      hasLoggedFailure = true;
    }
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  // Attempt initial quick connect
  redisClient.connect().catch(() => {
    isConnected = false;
    if (!hasLoggedFailure) {
      console.warn('[REDIS] [NOTICE] Redis connection skipped. Running in-memory cache mode.');
      hasLoggedFailure = true;
    }
  });
} catch (e) {
  isConnected = false;
  console.warn('[REDIS] Redis initialization skipped:', e.message);
}

export const isRedisReady = () => isConnected;

/**
 * Retrieve cached JSON value
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  if (isConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // Memory fallback lookup
  const entry = memoryFallbackStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryFallbackStore.delete(key);
    return null;
  }
  return entry.data;
};

/**
 * Set cache value with TTL in seconds
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
export const setCache = async (key, value, ttlSeconds = 45) => {
  const jsonStr = JSON.stringify(value);

  if (isConnected && redisClient) {
    try {
      await redisClient.set(key, jsonStr, 'EX', ttlSeconds);
      return;
    } catch (err) {
      // Fall through to memory
    }
  }

  // Memory fallback write
  memoryFallbackStore.set(key, {
    data: value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  // Keep memory cache bounded
  if (memoryFallbackStore.size > 2000) {
    const oldestKey = memoryFallbackStore.keys().next().value;
    memoryFallbackStore.delete(oldestKey);
  }
};

/**
 * Invalidate cache by key or pattern
 * @param {string} patternOrKey 
 */
export const deleteCache = async (patternOrKey) => {
  if (!patternOrKey) {
    memoryFallbackStore.clear();
    if (isConnected && redisClient) {
      try {
        await redisClient.flushdb();
      } catch {}
    }
    return;
  }

  // Memory store clearing
  for (const k of memoryFallbackStore.keys()) {
    if (k.includes(patternOrKey)) {
      memoryFallbackStore.delete(k);
    }
  }

  // Redis store clearing
  if (isConnected && redisClient) {
    try {
      const keys = await redisClient.keys(`*${patternOrKey}*`);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {}
  }
};

/**
 * Flush all cached entries
 */
export const clearAllCache = async () => {
  memoryFallbackStore.clear();
  if (isConnected && redisClient) {
    try {
      await redisClient.flushdb();
    } catch {}
  }
};

export default {
  redisClient,
  isRedisReady,
  getCache,
  setCache,
  deleteCache,
  clearAllCache
};

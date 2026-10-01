import axios from 'axios';

const formatBaseUrl = () => {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    url = isLocal ? 'http://localhost:5000/api/v1' : 'https://transitops-backend-nkkb.onrender.com/api/v1';
  }

  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url += '/api/v1';
  }
  return url;
};

// ============================================================================
// CLIENT-SIDE IN-MEMORY API CACHE
// ============================================================================
const apiCacheStore = new Map(); // key -> { data, timestamp, ttl }
const DEFAULT_CLIENT_TTL = 15 * 60 * 1000; // 15 minutes (data remains cached unless changed via mutation)

// Normalize params by stripping empty/null/undefined attributes for deterministic cache matching
const normalizeParams = (params) => {
  if (!params || typeof params !== 'object') return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) {
      cleaned[k] = v;
    }
  }
  return cleaned;
};

export const getCacheKey = (url = '', params = {}) => {
  return `${url}_${JSON.stringify(normalizeParams(params))}`;
};

// In-flight request deduplication store (cacheKey -> Promise)
const inFlightRequests = new Map();

/**
 * Clear cached API responses manually or by resource prefix
 */
export const clearApiCache = (resourcePrefix = null) => {
  if (!resourcePrefix) {
    apiCacheStore.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of apiCacheStore.keys()) {
    if (key.includes(resourcePrefix) || key.includes('dashboard') || key.includes('reports')) {
      apiCacheStore.delete(key);
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.includes(resourcePrefix) || key.includes('dashboard') || key.includes('reports')) {
      inFlightRequests.delete(key);
    }
  }
};

let memoryCsrfToken = null;
export const setCsrfToken = (token) => { memoryCsrfToken = token; };

const axiosInstance = axios.create({
  baseURL: formatBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Request Interceptor: Attach JWT Token from sessionStorage, CSRF token, and check GET cache
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Session Storage - check for active auth token
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    
    // Check if the endpoint is public
    const cleanReqUrl = (config.url || '').toLowerCase();
    const isPublicAuthEndpoint = 
      cleanReqUrl.includes('/auth/login') ||
      cleanReqUrl.includes('/auth/register') ||
      cleanReqUrl.includes('/auth/verify-otp') ||
      cleanReqUrl.includes('/auth/resend-otp') ||
      cleanReqUrl.includes('/auth/forgot-password') ||
      cleanReqUrl.includes('/auth/reset-password') ||
      cleanReqUrl.includes('/auth/ip-status') ||
      cleanReqUrl.includes('/auth/unblock') ||
      cleanReqUrl.includes('/auth/csrf-token') ||
      cleanReqUrl.includes('/health');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicAuthEndpoint) {
      // Abort unauthenticated calls to protected routes locally before hitting network
      const cancelSource = axios.CancelToken.source();
      config.cancelToken = cancelSource.token;
      cancelSource.cancel('Authentication required: Unauthenticated request aborted.');
      return config;
    }

    // 2. Anti-CSRF Header
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (memoryCsrfToken) {
      config.headers['X-CSRF-Token'] = memoryCsrfToken;
    }

    const method = (config.method || 'get').toLowerCase();

    // 3. Client-side Idempotency Header for Mutating Operations (POST, PUT, DELETE)
    // Prevents duplicate database insertions on double-clicks or repeated submissions
    if (['post', 'put', 'delete'].includes(method)) {
      if (!config.headers['Idempotency-Key'] && !config.headers['idempotency-key']) {
        const payloadStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data || {});
        let hash = 0;
        const keyBase = `${config.url}_${payloadStr}`;
        for (let i = 0; i < keyBase.length; i++) {
          hash = ((hash << 5) - hash) + keyBase.charCodeAt(i);
          hash |= 0;
        }
        config.headers['Idempotency-Key'] = `idemp_${Date.now()}_${Math.abs(hash)}`;
      }
    }

    // 4. Client-side GET caching
    if (method === 'get' && config.cache !== false) {
      const cacheKey = getCacheKey(config.url, config.params);
      const cached = apiCacheStore.get(cacheKey);
      const ttl = config.ttl || DEFAULT_CLIENT_TTL;

      if (cached && Date.now() - cached.timestamp < ttl) {
        // Return resolved cached response without performing network roundtrip
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (Cached)',
          headers: { 'x-client-cache': 'HIT' },
          config,
          request: {}
        });
      }
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// Response Interceptor: Save GET cache, bust cache on mutations, handle lockout redirect
axiosInstance.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toLowerCase();

    // Cache successful GET responses
    if (method === 'get' && response.config.cache !== false && response.data) {
      const cacheKey = getCacheKey(response.config.url, response.config.params);
      apiCacheStore.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }

    // Invalidate relevant cache on mutations
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const cleanUrl = (response.config.url || '').replace(/^\/?api\/v1\//, '').replace(/^\//, '');
      const resource = cleanUrl.split('/')[0] || '';
      clearApiCache(resource);
      clearApiCache('dashboard');
      clearApiCache('reports');
    }

    return response.data;
  },
  async (err) => {
    const status = err.response?.status || (err.code === 'ECONNABORTED' ? 408 : 0);
    const serverMessage = err.response?.data?.message;

    // 1. Automatic Retry for Transient Network Glitches / Render Sleep Spin-up
    const config = err.config;
    const isTransientError = !err.response && (status === 0 || err.code === 'ECONNABORTED' || err.message === 'Network Error');
    if (config && isTransientError && (config.__retryCount || 0) < 2) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      const delayMs = config.__retryCount * 1200;
      await new Promise((res) => setTimeout(res, delayMs));
      return axiosInstance(config);
    }

    // Handle Network Error or Timeout
    let defaultMsg = 'Unable to reach the server. Please check your connection.';
    if (err.code === 'ECONNABORTED') {
      defaultMsg = 'Request timed out. Please try again.';
    } else if (serverMessage) {
      defaultMsg = serverMessage;
    }

    const customError = {
      message: defaultMsg,
      status: status,
      errors: err.response?.data?.errors || null,
      code: err.response?.data?.code || null,
      data: err.response?.data || null
    };

    // Handle locally canceled/aborted requests
    if (axios.isCancel(err)) {
      return Promise.reject({
        message: err.message || 'Request cancelled.',
        status: 401,
        isCanceled: true
      });
    }

    // Only log error in development, omitting any sensitive payloads
    const isProbe = err.config?.url?.includes('/auth/ip-status') || err.config?.url?.includes('/health');
    if (!isProbe && status !== 0 && import.meta.env?.DEV) {
      console.warn(`[API ${status}]`, err.config?.url, err.message);
    }

    // Public routes that should never be forcefully redirected away during navigation
    const publicPaths = ['/', '/landing', '/terms', '/privacy', '/login', '/register', '/verify-otp', '/forgot-password', '/blocked', '/401', '/403', '/404'];
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublicRoute = publicPaths.includes(currentPath);

    // Auto-clean credentials and redirect to /login on Unauthorized (only on protected routes)
    if (customError.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (!isPublicRoute && window.location.pathname !== '/login') {
          // Direct cleanly to /login with replace so back button doesn't bounce back
          window.location.replace('/login');
        }
      }
    }

    // Auto-redirect to custom /blocked page ONLY on explicit IP lockout or account lockout
    const isLockout = err.response?.data?.code === 'IP_BLOCKED' || 
                      err.response?.data?.code === 'ACCOUNT_LOCKED' ||
                      (err.response?.data?.blocked === true && (customError.status === 403 || customError.status === 429));

    if (isLockout) {
      const remainingMinutes = err.response?.data?.remainingMinutes || 15;
      const remainingSeconds = err.response?.data?.remainingSeconds || (remainingMinutes * 60);
      const blockedUntil = err.response?.data?.blockedUntil || (Date.now() + remainingSeconds * 1000);

      const lockoutData = {
        message: err.response?.data?.message || 'You have tried too many times. Please try again after some time.',
        remainingMinutes,
        remainingSeconds,
        blockedUntil,
        reason: err.response?.data?.reason || 'TOO_MANY_FAILED_ATTEMPTS',
        timestamp: Date.now()
      };

      try {
        sessionStorage.setItem('lockout_info', JSON.stringify(lockoutData));
      } catch (e) {}
      
      if (typeof window !== 'undefined' && window.location.pathname !== '/blocked') {
        window.location.replace('/blocked');
      }
    }

    return Promise.reject(customError);
  }
);

// In-Flight Promise Deduplication Wrapper for GET Requests
const rawGet = axiosInstance.get.bind(axiosInstance);
axiosInstance.get = function (url, config = {}) {
  if (config.cache === false) {
    return rawGet(url, config);
  }

  const cacheKey = getCacheKey(url, config.params);

  // 1. Check local cache first
  const cached = apiCacheStore.get(cacheKey);
  const ttl = config.ttl || DEFAULT_CLIENT_TTL;
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  // 2. Return pending in-flight promise if duplicate request is currently executing
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Initiate request and register in-flight tracker
  const promise = rawGet(url, config).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
};

export default axiosInstance;

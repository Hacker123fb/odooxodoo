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

const axiosInstance = axios.create({
  baseURL: formatBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if available in local storage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// Response Interceptor: Flatten results and translate standard error responses
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (err) => {
    const status = err.response?.status || (err.code === 'ECONNABORTED' ? 408 : 0);
    const serverMessage = err.response?.data?.message;

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
      code: err.response?.data?.code || null
    };

    console.error('[API Error Details]:', {
      url: err.config?.url,
      baseURL: err.config?.baseURL,
      status: status,
      message: err.message,
      data: err.response?.data
    });

    // Auto-clean credentials on token expiration status codes
    if (customError.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Auto-redirect to custom /blocked page on rate limit (429) or IP lockout (403)
    if (customError.status === 429 || customError.status === 403 || err.response?.data?.code === 'IP_BLOCKED') {
      const lockoutData = {
        message: err.response?.data?.message || 'You have tried too many times. Please try again after some time.',
        remainingMinutes: err.response?.data?.remainingMinutes || 60,
        reason: err.response?.data?.reason || 'TOO_MANY_FAILED_ATTEMPTS',
        timestamp: Date.now()
      };
      try {
        sessionStorage.setItem('lockout_info', JSON.stringify(lockoutData));
      } catch (e) {}
      
      if (typeof window !== 'undefined' && window.location.pathname !== '/blocked') {
        window.location.href = '/blocked';
      }
    }

    return Promise.reject(customError);
  }
);

export default axiosInstance;

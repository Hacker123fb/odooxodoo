import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
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
    // Return standard response data envelope directly
    return response.data;
  },
  (err) => {
    const customError = {
      message: err.response?.data?.message || 'A network error occurred. Please try again.',
      status: err.response?.status || 500,
      errors: err.response?.data?.errors || null
    };

    // Auto-clean credentials on token expiration status codes
    if (customError.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(customError);
  }
);

export default axiosInstance;

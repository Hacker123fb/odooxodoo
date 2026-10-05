import axiosInstance, { clearApiCache } from './axiosInstance.js';

export { clearApiCache };

export const authService = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  register: (data) => axiosInstance.post('/auth/register', data),
  verifyOtp: (data) => axiosInstance.post('/auth/verify-otp', data),
  resendOtp: (data) => axiosInstance.post('/auth/resend-otp', data),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
  getMe: () => axiosInstance.get('/auth/me'),
  getIpStatus: () => axiosInstance.get('/auth/ip-status', { cache: false }),
  unblock: () => axiosInstance.post('/auth/unblock', {}, { cache: false }),
  getCsrfToken: () => axiosInstance.get('/auth/csrf-token', { cache: false }),
  deleteAccount: (data) => axiosInstance.delete('/auth/delete-account', { data }),
  verifySecuritySignature: (data) => axiosInstance.post('/auth/verify-security-signature', data, { cache: false }),
  getPendingApprovals: () => axiosInstance.get('/auth/pending-approvals', { cache: false }),
  approveUser: (id) => axiosInstance.patch(`/auth/pending-approvals/${id}/approve`),
  rejectUser: (id) => axiosInstance.patch(`/auth/pending-approvals/${id}/reject`)
};

/**
 * Authoritative Backend Cryptographic Proof Verification
 * Verifies that a critical security task was legitimately signed by the backend
 * before permitting the frontend UI to display success.
 */
export const verifyBackendSecurityProof = async (result, expectedAction, expectedIdentifier) => {
  const payload = result?.data || result || {};
  const signature = payload?.securitySignature;
  const verifiedAt = payload?.verifiedAt;
  const action = payload?.action || expectedAction;
  const identifier = payload?.identifier || expectedIdentifier;

  if (!signature || typeof signature !== 'string' || !signature.startsWith('sec_sig_')) {
    throw new Error('Security verification failed: authoritative backend signature missing.');
  }

  // Cryptographic verification with server
  const verifyRes = await authService.verifySecuritySignature({
    signature,
    action,
    identifier,
    timestamp: verifiedAt
  });

  if (!verifyRes || !verifyRes.valid) {
    throw new Error('Security verification failed: signature integrity check rejected by backend.');
  }

  return true;
};

export const vehicleService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/vehicles', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/vehicles/${id}`, config),
  create: (data) => axiosInstance.post('/vehicles', data),
  update: (id, data) => axiosInstance.put(`/vehicles/${id}`, data),
  delete: (id) => axiosInstance.delete(`/vehicles/${id}`),
  getOptions: (config = {}) => axiosInstance.get('/vehicles/meta/options', config)
};

export const driverService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/drivers', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/drivers/${id}`, config),
  create: (data) => axiosInstance.post('/drivers', data),
  update: (id, data) => axiosInstance.put(`/drivers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/drivers/${id}`)
};

export const tripService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/trips', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/trips/${id}`, config),
  create: (data) => axiosInstance.post('/trips', data),
  update: (id, data) => axiosInstance.put(`/trips/${id}`, data),
  delete: (id) => axiosInstance.delete(`/trips/${id}`),
  getOptions: (params = {}, config = {}) => axiosInstance.get('/trips/meta/options', { params, ...config })
};

export const maintenanceService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/maintenance', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/maintenance/${id}`, config),
  create: (data) => axiosInstance.post('/maintenance', data),
  update: (id, data) => axiosInstance.put(`/maintenance/${id}`, data),
  delete: (id) => axiosInstance.delete(`/maintenance/${id}`)
};

export const fuelService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/fuel', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/fuel/${id}`, config),
  create: (data) => axiosInstance.post('/fuel', data),
  update: (id, data) => axiosInstance.put(`/fuel/${id}`, data),
  delete: (id) => axiosInstance.delete(`/fuel/${id}`),
  getOptions: (config = {}) => axiosInstance.get('/fuel/meta/options', config)
};

export const expenseService = {
  getAll: (params = {}, config = {}) => axiosInstance.get('/expenses', { params, ...config }),
  getById: (id, config = {}) => axiosInstance.get(`/expenses/${id}`, config),
  create: (data) => axiosInstance.post('/expenses', data),
  update: (id, data) => axiosInstance.put(`/expenses/${id}`, data),
  delete: (id) => axiosInstance.delete(`/expenses/${id}`),
  getOptions: (config = {}) => axiosInstance.get('/expenses/meta/options', config)
};

export const dashboardService = {
  getDashboard: (config = {}) => axiosInstance.get('/dashboard', config)
};

export const reportService = {
  getReport: (params = {}, config = {}) => axiosInstance.get('/reports', { params, ...config })
};

export const notificationService = {
  getAll: (config = {}) => axiosInstance.get('/notifications', config),
  markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosInstance.put('/notifications/read-all')
};

export const healthService = {
  check: (config = {}) => axiosInstance.get('/health', config)
};

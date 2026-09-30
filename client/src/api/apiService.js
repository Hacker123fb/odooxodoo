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
  verifySecuritySignature: (data) => axiosInstance.post('/auth/verify-security-signature', data, { cache: false })
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
  getAll: (params) => axiosInstance.get('/vehicles', { params }),
  getById: (id) => axiosInstance.get(`/vehicles/${id}`),
  create: (data) => axiosInstance.post('/vehicles', data),
  update: (id, data) => axiosInstance.put(`/vehicles/${id}`, data),
  delete: (id) => axiosInstance.delete(`/vehicles/${id}`),
  getOptions: () => axiosInstance.get('/vehicles/meta/options')
};

export const driverService = {
  getAll: (params) => axiosInstance.get('/drivers', { params }),
  getById: (id) => axiosInstance.get(`/drivers/${id}`),
  create: (data) => axiosInstance.post('/drivers', data),
  update: (id, data) => axiosInstance.put(`/drivers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/drivers/${id}`)
};

export const tripService = {
  getAll: (params) => axiosInstance.get('/trips', { params }),
  getById: (id) => axiosInstance.get(`/trips/${id}`),
  create: (data) => axiosInstance.post('/trips', data),
  update: (id, data) => axiosInstance.put(`/trips/${id}`, data),
  delete: (id) => axiosInstance.delete(`/trips/${id}`),
  getOptions: (params) => axiosInstance.get('/trips/meta/options', { params })
};

export const maintenanceService = {
  getAll: (params) => axiosInstance.get('/maintenance', { params }),
  getById: (id) => axiosInstance.get(`/maintenance/${id}`),
  create: (data) => axiosInstance.post('/maintenance', data),
  update: (id, data) => axiosInstance.put(`/maintenance/${id}`, data),
  delete: (id) => axiosInstance.delete(`/maintenance/${id}`)
};

export const fuelService = {
  getAll: (params) => axiosInstance.get('/fuel', { params }),
  getById: (id) => axiosInstance.get(`/fuel/${id}`),
  create: (data) => axiosInstance.post('/fuel', data),
  update: (id, data) => axiosInstance.put(`/fuel/${id}`, data),
  delete: (id) => axiosInstance.delete(`/fuel/${id}`),
  getOptions: () => axiosInstance.get('/fuel/meta/options')
};

export const expenseService = {
  getAll: (params) => axiosInstance.get('/expenses', { params }),
  getById: (id) => axiosInstance.get(`/expenses/${id}`),
  create: (data) => axiosInstance.post('/expenses', data),
  update: (id, data) => axiosInstance.put(`/expenses/${id}`, data),
  delete: (id) => axiosInstance.delete(`/expenses/${id}`),
  getOptions: () => axiosInstance.get('/expenses/meta/options')
};

export const dashboardService = {
  getDashboard: () => axiosInstance.get('/dashboard')
};

export const reportService = {
  getReport: (params) => axiosInstance.get('/reports', { params })
};

export const notificationService = {
  getAll: () => axiosInstance.get('/notifications'),
  markAsRead: (id) => axiosInstance.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosInstance.put('/notifications/read-all')
};

export const healthService = {
  check: () => axiosInstance.get('/health')
};

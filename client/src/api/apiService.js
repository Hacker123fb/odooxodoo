import axiosInstance from './axiosInstance.js';

export const authService = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  register: (data) => axiosInstance.post('/auth/register', data),
  getMe: () => axiosInstance.get('/auth/me')
};

export const vehicleService = {
  getAll: (params) => axiosInstance.get('/vehicles', { params }),
  getById: (id) => axiosInstance.get(`/vehicles/${id}`),
  create: (data) => axiosInstance.post('/vehicles', data),
  update: (id, data) => axiosInstance.put(`/vehicles/${id}`, data),
  delete: (id) => axiosInstance.delete(`/vehicles/${id}`)
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
  update: (id, data) => axiosInstance.put(`/trips/${id}`, data)
};

export const maintenanceService = {
  getAll: (params) => axiosInstance.get('/maintenance', { params }),
  create: (data) => axiosInstance.post('/maintenance', data)
};

export const fuelService = {
  getAll: (params) => axiosInstance.get('/fuel', { params }),
  create: (data) => axiosInstance.post('/fuel', data)
};

export const expenseService = {
  getAll: (params) => axiosInstance.get('/expenses', { params }),
  create: (data) => axiosInstance.post('/expenses', data)
};

export const healthService = {
  check: () => axiosInstance.get('/health')
};

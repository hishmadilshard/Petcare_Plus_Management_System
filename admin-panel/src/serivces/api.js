import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// =====================================================
// AUTH ENDPOINTS
// =====================================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// =====================================================
// USER ENDPOINTS
// =====================================================
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getVets: () => api.get('/users/vets'),
  getByRole: (role) => api.get(`/users/role/${role}`)
};

// =====================================================
// PET ENDPOINTS
// =====================================================
export const petAPI = {
  getAll: (params) => api.get('/pets', { params }),
  getById: (id) => api.get(`/pets/${id}`),
  create: (data) => api.post('/pets', data),
  update: (id, data) => api.put(`/pets/${id}`, data),
  delete: (id) => api.delete(`/pets/${id}`),
  getByOwner: (ownerId) => api.get(`/pets/owner/${ownerId}`),
  getMedicalHistory: (id) => api.get(`/pets/${id}/medical-history`)
};

// =====================================================
// APPOINTMENT ENDPOINTS
// =====================================================
export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { cancellation_reason: reason }),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  getUpcoming: () => api.get('/appointments/upcoming'),
  getByDate: (date) => api.get(`/appointments/date/${date}`)
};

// =====================================================
// MEDICAL RECORD ENDPOINTS
// =====================================================
export const medicalRecordAPI = {
  getAll: (params) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  create: (data) => api.post('/medical-records', data),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  delete: (id) => api.delete(`/medical-records/${id}`),
  getByPet: (petId) => api.get(`/medical-records/pet/${petId}`)
};

// =====================================================
// VACCINATION ENDPOINTS
// =====================================================
export const vaccinationAPI = {
  getAll: (params) => api.get('/vaccinations', { params }),
  getById: (id) => api.get(`/vaccinations/${id}`),
  create: (data) => api.post('/vaccinations', data),
  update: (id, data) => api.put(`/vaccinations/${id}`, data),
  delete: (id) => api.delete(`/vaccinations/${id}`),
  getByPet: (petId) => api.get(`/vaccinations/pet/${petId}`),
  getDue: () => api.get('/vaccinations/due'),
  sendReminders: () => api.post('/vaccinations/send-reminders')
};

// =====================================================
// INVENTORY ENDPOINTS
// =====================================================
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  adjust: (id, adjustment, reason) => api.put(`/inventory/${id}/adjust`, { adjustment, reason }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getExpired: () => api.get('/inventory/expired'),
  getExpiringSoon: () => api.get('/inventory/expiring-soon'),
  getByCategory: (category) => api.get(`/inventory/category/${category}`),
  getStats: () => api.get('/inventory/stats')
};

// =====================================================
// INVOICE ENDPOINTS
// =====================================================
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  markAsPaid: (id, data) => api.put(`/invoices/${id}/pay`, data),
  getPending: () => api.get('/invoices/pending'),
  getStats: () => api.get('/invoices/stats')
};

// =====================================================
// NOTIFICATION ENDPOINTS
// =====================================================
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getAllAdmin: (params) => api.get('/notifications/all', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  create: (data) => api.post('/notifications', data),
  sendBulk: (data) => api.post('/notifications/bulk', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count')
};

export default api;
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data;
          Cookies.set('access_token', accessToken, { expires: 1/96 }); // 15 min
          if (typeof localStorage !== 'undefined') localStorage.setItem('access_token', accessToken);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      // Refresh failed — clear auth
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      if (typeof localStorage !== 'undefined') localStorage.removeItem('access_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Vendors
export const vendorApi = {
  search: (params: Record<string, any>) => api.get('/vendors', { params }),
  getById: (id: string) => api.get(`/vendors/${id}`),
  getPackages: (id: string) => api.get(`/vendors/${id}/packages`),
  getReviews: (id: string, params?: Record<string, any>) => api.get(`/vendors/${id}/reviews`, { params }),
  getAvailability: (id: string, year: number, month: number) => api.get(`/vendors/${id}/availability`, { params: { year, month } }),
  getPortfolio: (id: string) => api.get(`/vendors/${id}/portfolio`),
  updateMe: (data: any) => api.put('/vendors/me', data),
};

// Search
export const searchApi = {
  search: (params: Record<string, any>) => api.get('/search/vendors', { params }),
  autocomplete: (q: string) => api.get('/search/autocomplete', { params: { q } }),
};

// Bookings
export const bookingApi = {
  enquire: (data: any) => api.post('/bookings/enquire', data),
  list: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  confirm: (id: string) => api.put(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.put(`/bookings/${id}/cancel`, { reason }),
};

// Payments
export const paymentApi = {
  createOrder: (data: any) => api.post('/payments/create-order', data),
  verify: (data: any) => api.post('/payments/verify', data),
  getByBooking: (bookingId: string) => api.get(`/payments/booking/${bookingId}`),
};

// User profile
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
};

// Execution / Timeline
export const executionApi = {
  getTimeline: (customerId: string) => api.get(`/execution/timeline/${customerId}`),
  createTimeline: (data: any) => api.post('/execution/timeline', data),
  updateTask: (taskId: string, data: any) => api.put(`/execution/tasks/${taskId}`, data),
};

// Reviews
export const reviewApi = {
  create: (data: any) => api.post('/reviews', data),
  getVendorReviews: (vendorId: string, params?: any) => api.get(`/reviews/vendor/${vendorId}`, { params }),
};

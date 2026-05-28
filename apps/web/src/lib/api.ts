import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export interface Vendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  citiesServed: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  basePrice: number;
  coverImage?: string;
  verificationStatus: string;
  description?: string;
  yearsExperience?: number;
  teamSize?: number;
  featured?: boolean;
  responseTime?: string;
  cancellationRate?: number;
  tags?: string[];
  distance?: number;
}

export interface NotificationItem {
  id: string;
  type: 'booking' | 'message' | 'review' | 'payment' | 'system';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  detail?: string;
  category?: string;
  dueDate?: string;
  isDone: boolean;
}

export interface BudgetItem {
  id: string;
  category: string;
  label: string;
  estimatedPaise: number;
  actualPaise?: number | null;
  vendorName?: string | null;
  bookingId?: string | null;
  isPaid: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  id: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  vendorName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  contentType?: string;
  createdAt: string;
}

interface RefreshResponse {
  data: {
    accessToken: string;
  };
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const res = await axios.post<RefreshResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data;
          Cookies.set('access_token', accessToken, { expires: 1 / 96 });
          if (typeof localStorage !== 'undefined') localStorage.setItem('access_token', accessToken);
          original.headers.Authorization = 'Bearer ' + accessToken;
          return api(original);
        }
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', refreshError);
      }

      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      if (typeof localStorage !== 'undefined') localStorage.removeItem('access_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const vendorApi = {
  search: (params: Record<string, unknown>) => api.get('/vendors', { params }),
  getById: (id: string) => api.get(`/vendors/${id}`),
  getPackages: (id: string) => api.get(`/vendors/${id}/packages`),
  getReviews: (id: string, params?: Record<string, unknown>) => api.get(`/vendors/${id}/reviews`, { params }),
  getAvailability: (id: string, year: number, month: number) => api.get(`/vendors/${id}/availability`, { params: { year, month } }),
  getPortfolio: (id: string) => api.get(`/vendors/${id}/portfolio`),
  updateMe: <T extends object>(data: T) => api.put('/vendors/me', data),
};

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; type?: string }) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const chatApi = {
  listConversations: () => api.get('/chat/conversations'),
  getMessages: (bookingId: string, page?: number) => api.get(`/chat/conversations/${bookingId}/messages`, { params: { page } }),
  createConversation: (data: { bookingId: string; customerId: string; vendorId: string }) => api.post('/chat/conversations', data),
};

export const checklistApi = {
  list: () => api.get('/users/me/checklist'),
  create: (data: { title: string; detail?: string; category?: string; dueDate?: string }) => api.post('/users/me/checklist', data),
  update: (id: string, data: Partial<ChecklistItem>) => api.patch(`/users/me/checklist/${id}`, data),
  delete: (id: string) => api.delete(`/users/me/checklist/${id}`),
  generateDefaults: (weddingDate: string) => api.post('/users/me/checklist/generate', { weddingDate }),
};

export const searchApi = {
  search: (params: {
    query?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    lat?: number;
    lng?: number;
    radius?: string;
    pincode?: string;
    eventType?: string;
  }) => api.get('/search/vendors', { params }),
  autocomplete: (q: string) => api.get('/search/autocomplete', { params: { q } }),
};

export const bookingApi = {
  enquire: <T extends object>(data: T) => api.post('/bookings/enquire', data),
  list: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  confirm: (id: string) => api.put(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.put(`/bookings/${id}/cancel`, { reason }),
};

export const paymentApi = {
  createOrder: <T extends object>(data: T) => api.post('/payments/create-order', data),
  verify: <T extends object>(data: T) => api.post('/payments/verify', data),
  getByBooking: (bookingId: string) => api.get(`/payments/booking/${bookingId}`),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: <T extends object>(data: T) => api.put('/users/me', data),
  getBudget: async () => {
    const { data } = await api.get('/users/me/budget');
    return data.data;
  },
  createBudgetItem: async (item: { category: string; label: string; estimatedPaise: number; actualPaise?: number; vendorName?: string; isPaid?: boolean; notes?: string }) => {
    const { data } = await api.post('/users/me/budget', item);
    return data.data.item;
  },
  updateBudgetItem: async (id: string, updates: Record<string, unknown>) => {
    const { data } = await api.patch(`/users/me/budget/${id}`, updates);
    return data.data.item;
  },
  deleteBudgetItem: async (id: string) => {
    const { data } = await api.delete(`/users/me/budget/${id}`);
    return data.data;
  },
};

export const executionApi = {
  getTimeline: (customerId: string) => api.get(`/execution/timeline/${customerId}`),
  createTimeline: <T extends object>(data: T) => api.post('/execution/timeline', data),
  updateTask: <T extends object>(taskId: string, data: T) => api.put(`/execution/tasks/${taskId}`, data),
};

export const reviewApi = {
  create: <T extends object>(data: T) => api.post('/reviews', data),
  getVendorReviews: (vendorId: string, params?: Record<string, unknown>) => api.get(`/reviews/vendor/${vendorId}`, { params }),
};

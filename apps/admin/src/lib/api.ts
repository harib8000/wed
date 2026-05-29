/**
 * Admin API Client — Axios instance that proxies via Vite dev server in development,
 * or uses VITE_API_URL in production.
 * Reads the admin JWT from a cookie and refreshes on 401.
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import Cookies from 'js-cookie';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
// In dev: empty baseURL so Vite proxy handles /api/* → individual services.
// In prod: set VITE_API_URL to the gateway base (e.g. https://api.weddingos.in/api/v1).
const BASE_URL = env?.VITE_API_URL ?? '/api';

export const adminApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
adminApi.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 with token refresh ──────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
};

adminApi.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config;
    if (!originalRequest || err.response?.status !== 401) {
      return Promise.reject(err);
    }

    // Don't retry the refresh call itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      Cookies.remove('admin_token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return adminApi(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken = data?.data?.accessToken;
      if (newToken) {
        Cookies.set('admin_token', newToken, { expires: 1 / 96, sameSite: 'lax' });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return adminApi(originalRequest);
      }
      throw new Error('No access token in refresh response');
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      Cookies.remove('admin_token');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Typed API helpers ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface DashboardStats {
  totalUsers: number;
  activeVendors: number;
  totalBookings: number;
  revenueThisMonth: number;
  revenueTotal: number;
  pendingKyc: number;
  openDisputes: number;
  avgRating: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

export interface Vendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  status: 'PENDING_KYC' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  avgRating: number;
  reviewCount: number;
  bookingCount: number;
  createdAt: string;
  userId: string;
}

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  eventDate: string;
  status: string;
  quotedAmountPaise: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amountPaise: number;
  status: string;
  razorpayOrderId: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  phone?: string;
  email: string | null;
  name: string | null;
  role?: string;
  city?: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  // Routes through Vite proxy: /api/admin/* → user-service /users/admin/*
  getStats: () =>
    adminApi.get<{ success: boolean; data: DashboardStats }>('/admin/stats').then((r) => r.data.data),

  getMonthlyRevenue: () =>
    adminApi.get<{ success: boolean; data: MonthlyRevenue[] }>('/admin/revenue/monthly').then((r) => r.data.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────────────────────────────────────

export const vendorsApi = {
  // Routes through Vite proxy: /api/vendors/* → vendor-service /vendors/*
  list: (params: { page?: number; limit?: number; status?: string; category?: string; q?: string }) =>
    adminApi
      .get<PaginatedResponse<{ vendors: Vendor[] }>>('/vendors/admin/list', { params })
      .then((r) => r.data),

  approve: (vendorId: string) =>
    adminApi.patch(`/vendors/${vendorId}/approve`).then((r) => r.data),

  reject: (vendorId: string, reason: string) =>
    adminApi.patch(`/vendors/${vendorId}/reject`, { reason }).then((r) => r.data),

  suspend: (vendorId: string, reason: string) =>
    adminApi.patch(`/vendors/${vendorId}/suspend`, { note: reason }).then((r) => r.data),

  getById: (vendorId: string) =>
    adminApi.get<{ success: boolean; data: { vendor: Vendor } }>(`/vendors/${vendorId}`).then((r) => r.data.data.vendor),
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const bookingsApi = {
  // Routes through Vite proxy: /api/bookings/* → booking-service /bookings/*
  list: (params: { page?: number; limit?: number; status?: string }) =>
    adminApi
      .get<PaginatedResponse<{ bookings: Booking[] }>>('/bookings/admin/list', { params })
      .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const paymentsApi = {
  // Routes through Vite proxy: /api/payments/* → payment-service /payments/*
  list: (params: { page?: number; limit?: number; status?: string }) =>
    adminApi
      .get<PaginatedResponse<{ payments: Payment[] }>>('/payments/admin/list', { params })
      .then((r) => r.data),

  refund: (paymentId: string, reason: string, note?: string) =>
    adminApi.post(`/payments/${paymentId}/refund`, { reason, note }).then((r) => r.data),

  releaseEscrow: (escrowId: string) =>
    adminApi.post(`/payments/escrow/${escrowId}/release`).then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export const usersApi = {
  // Routes through Vite proxy: /api/users/* → user-service /users/*
  list: (params: { page?: number; limit?: number; role?: string; q?: string }) =>
    adminApi
      .get<PaginatedResponse<{ users: AdminUser[] }>>('/users/admin/list', { params })
      .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPUTES
// ─────────────────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  vendorName: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CUSTOMER' | 'RESOLVED_VENDOR' | 'CLOSED';
  evidenceUrls: string[];
  refundAmountPaise: number | null;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const disputesApi = {
  // Routes through Vite proxy: /api/payments/* → payment-service /payments/*
  list: (params: { page?: number; limit?: number; status?: string }) =>
    adminApi
      .get<PaginatedResponse<{ disputes: Dispute[] }>>('/payments/admin/disputes', { params })
      .then((r) => r.data),

  resolve: (disputeId: string, body: { status: string; refundAmountPaise?: number; adminNotes: string }) =>
    adminApi.post(`/payments/admin/disputes/${disputeId}/resolve`, body).then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportSummary {
  totalRevenue: number;
  platformFees: number;
  activeVendors: number;
  activeCustomers: number;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  topVendors: Array<{ id: string; name: string; category: string; bookings: number; revenue: number; rating: number }>;
  categoryBreakdown: Array<{ category: string; bookings: number; revenue: number }>;
}

export const reportsApi = {
  // Routes through /api/admin/* → user-service /users/admin/*
  getSummary: (params?: { from?: string; to?: string }) =>
    adminApi
      .get<{ success: boolean; data: ReportSummary }>('/admin/reports/summary', { params })
      .then((r) => r.data.data),
};

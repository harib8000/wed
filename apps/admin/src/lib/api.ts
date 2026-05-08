/**
 * Admin API Client — Axios instance that hits the API gateway.
 * Reads the admin JWT from a cookie, refreshes on 401.
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

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

// ── Response interceptor: handle 401 ─────────────────────────────────────────
adminApi.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      Cookies.remove('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
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
  phone: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    adminApi.get<{ success: boolean; data: DashboardStats }>('/admin/stats').then((r) => r.data.data),

  getMonthlyRevenue: () =>
    adminApi.get<{ success: boolean; data: MonthlyRevenue[] }>('/admin/revenue/monthly').then((r) => r.data.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────────────────────────────────────

export const vendorsApi = {
  list: (params: { page?: number; limit?: number; status?: string; category?: string; q?: string }) =>
    adminApi
      .get<PaginatedResponse<{ vendors: Vendor[] }>>('/admin/vendors', { params })
      .then((r) => r.data),

  approve: (vendorId: string) =>
    adminApi.post(`/admin/vendors/${vendorId}/approve`).then((r) => r.data),

  reject: (vendorId: string, reason: string) =>
    adminApi.post(`/admin/vendors/${vendorId}/reject`, { reason }).then((r) => r.data),

  suspend: (vendorId: string, reason: string) =>
    adminApi.post(`/admin/vendors/${vendorId}/suspend`, { reason }).then((r) => r.data),

  getById: (vendorId: string) =>
    adminApi.get<{ success: boolean; data: { vendor: Vendor } }>(`/vendors/${vendorId}`).then((r) => r.data.data.vendor),
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const bookingsApi = {
  list: (params: { page?: number; limit?: number; status?: string }) =>
    adminApi
      .get<PaginatedResponse<{ bookings: Booking[] }>>('/admin/bookings', { params })
      .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params: { page?: number; limit?: number; status?: string }) =>
    adminApi
      .get<PaginatedResponse<{ payments: Payment[] }>>('/admin/payments', { params })
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
  list: (params: { page?: number; limit?: number; role?: string; q?: string }) =>
    adminApi
      .get<PaginatedResponse<{ users: AdminUser[] }>>('/admin/users', { params })
      .then((r) => r.data),
};

/**
 * Vendor Portal API Client — Axios instance with JWT auth.
 * Hits the API gateway and surfaces typed helpers for vendor operations.
 */
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const vendorApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
vendorApi.interceptors.request.use((cfg) => {
  const token = Cookies.get('access_token') || localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Response: handle 401 → logout ─────────────────────────────────────────────
vendorApi.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  category: string;
  city: string;
  state: string;
  tagline: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  bookingCount: number;
  plusMember: boolean;
  status: string;
  yearsExperience: number | null;
  teamSize: number | null;
  whatsappNumber: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  gstVerified: boolean;
  panVerified: boolean;
  packages: VendorPackage[];
}

export interface VendorPackage {
  id: string;
  name: string;
  packageType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'CUSTOM';
  priceFromPaise: number;
  priceUpToPaise: number | null;
  description: string | null;
  inclusions: string[];
  exclusions: string[];
  deliverables: string[];
  isActive: boolean;
}

export interface VendorBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  eventType: string;
  eventCity: string;
  status: string;
  quotedAmountPaise: number | null;
  platformFeePaise: number | null;
  packageName: string | null;
  createdAt: string;
}

export interface VendorStats {
  totalBookings: number;
  revenueThisMonth: number;
  avgRating: number;
  responseRate: number;
  pendingEnquiries: number;
  completedBookings: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────────────────────────────────────────

/** Dashboard stats for the logged-in vendor */
export const statsApi = {
  getDashboard: () =>
    vendorApi.get<{ success: boolean; data: VendorStats }>('/vendors/me/stats')
      .then((r) => r.data.data),

  getMonthlyRevenue: () =>
    vendorApi.get<{ success: boolean; data: MonthlyData[] }>('/vendors/me/revenue/monthly')
      .then((r) => r.data.data),
};

/** Vendor profile CRUD */
export const profileApi = {
  getProfile: () =>
    vendorApi.get<{ success: boolean; data: { vendor: VendorProfile } }>('/vendors/me')
      .then((r) => r.data.data.vendor),

  updateProfile: (body: Partial<VendorProfile>) =>
    vendorApi.put('/vendors/me', body).then((r) => r.data),

  upsertPackage: (pkg: Partial<VendorPackage> & { name: string; packageType: string; priceFromPaise: number }) =>
    vendorApi.post('/vendors/me/packages', pkg).then((r) => r.data),

  deletePackage: (id: string) =>
    vendorApi.delete(`/vendors/me/packages/${id}`).then((r) => r.data),

  getPresignedUpload: (contentType: string) =>
    vendorApi.post<{ success: boolean; data: { uploadUrl: string; publicUrl: string } }>(
      '/vendors/me/portfolio/presign', { contentType },
    ).then((r) => r.data.data),
};

/** Booking operations for vendor */
export const bookingApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    vendorApi.get<{ success: boolean; data: { bookings: VendorBooking[] }; meta: { total: number; page: number; pages: number } }>(
      '/bookings', { params },
    ).then((r) => r.data),

  getById: (id: string) =>
    vendorApi.get<{ success: boolean; data: { booking: VendorBooking } }>(`/bookings/${id}`)
      .then((r) => r.data.data.booking),

  sendQuote: (bookingId: string, body: { quotedAmountPaise: number; note?: string }) =>
    vendorApi.post(`/bookings/${bookingId}/quote`, body).then((r) => r.data),

  accept: (bookingId: string) =>
    vendorApi.post(`/bookings/${bookingId}/accept`).then((r) => r.data),

  reject: (bookingId: string, reason?: string) =>
    vendorApi.post(`/bookings/${bookingId}/cancel`, { reason }).then((r) => r.data),
};

/** Analytics */
export const analyticsApi = {
  getConversionFunnel: () =>
    vendorApi.get<{ success: boolean; data: { enquiries: number; quoted: number; confirmed: number; completed: number } }>(
      '/vendors/me/analytics/funnel',
    ).then((r) => r.data.data),

  getPackageDistribution: () =>
    vendorApi.get<{ success: boolean; data: Array<{ name: string; count: number; revenue: number }> }>(
      '/vendors/me/analytics/packages',
    ).then((r) => r.data.data),
};

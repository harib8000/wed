/**
 * Admin BFF routes — aggregates platform stats from all services.
 * Mounted at /users/admin/* (admin-only, requires admin JWT role).
 */
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { config } from '../config';
import { z } from 'zod';

export const adminRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

// ── Internal service HTTP helper ──────────────────────────────────────────────

async function internalGet<T>(url: string, token: string): Promise<T | null> {
  try {
    const authHeader = 'Bearer ' + token;
    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function internalGetFull<T>(url: string, token: string): Promise<{ data: T | null; meta: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { data: null, meta: {} };
    const json = (await res.json()) as { success: boolean; data: T; meta: Record<string, unknown> };
    return { data: json.data ?? null, meta: json.meta ?? {} };
  } catch {
    return { data: null, meta: {} };
  }
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const AdminUserListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  role: z.string().optional(),
});

// ── GET /users/admin/list ─────────────────────────────────────────────────────

adminRouter.get('/list', authenticate, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, q } = AdminUserListSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          state: true,
          createdAt: true,
        },
      }),
      prisma.userProfile.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users: profiles.map((p: { userId: string; firstName: string | null; lastName: string | null; email: string | null; city: string | null; createdAt: Date }) => ({
          id: p.userId,
          name: [p.firstName, p.lastName].filter(Boolean).join(' ') || null,
          email: p.email,
          city: p.city,
          createdAt: p.createdAt,
        })),
      },
      meta: { total, page, limit, pages: Math.ceil(total / limit), ...meta(req) },
    });
  } catch (err) { next(err); }
});

// ── GET /users/admin/stats — platform-wide aggregation ────────────────────────

adminRouter.get('/stats', authenticate, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.slice(7) ?? '';
    const [totalUsers, vendorStats, bookingStats, paymentStats, disputesFull, reviewStats] = await Promise.all([
      prisma.userProfile.count(),
      internalGet<{ total: number; active: number; pendingKyc: number }>(
        `${config.VENDOR_SERVICE_URL}/vendors/admin/stats`,
        token,
      ),
      internalGet<{ total: number; confirmed: number; completed: number }>(
        `${config.BOOKING_SERVICE_URL}/bookings/admin/stats`,
        token,
      ),
      internalGet<{ revenueTotal: number; revenueThisMonth: number }>(
        `${config.PAYMENT_SERVICE_URL}/payments/admin/stats`,
        token,
      ),
      internalGetFull<{ disputes: unknown[] }>(
        `${config.PAYMENT_SERVICE_URL}/payments/admin/disputes?limit=1&status=OPEN`,
        token,
      ),
      internalGet<{ avgRating: number; totalReviews: number }>(
        `${config.REVIEW_SERVICE_URL}/reviews/admin/stats`,
        token,
      ),
    ]);

    const openDisputes = (disputesFull.meta as Record<string, unknown> & { total?: number })?.total ?? 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeVendors: vendorStats?.active ?? 0,
        pendingKyc: vendorStats?.pendingKyc ?? 0,
        totalBookings: bookingStats?.total ?? 0,
        revenueThisMonth: paymentStats?.revenueThisMonth ?? 0,
        revenueTotal: paymentStats?.revenueTotal ?? 0,
        openDisputes,
        avgRating: reviewStats?.avgRating ?? 0,
      },
      meta: meta(req),
    });
  } catch (err) { next(err); }
});

// ── GET /users/admin/revenue/monthly ─────────────────────────────────────────

adminRouter.get('/revenue/monthly', authenticate, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.slice(7) ?? '';
    const data = await internalGet<{ monthly: Array<{ month: string; revenue: number; bookings: number }> }>(
      `${config.PAYMENT_SERVICE_URL}/payments/admin/stats`,
      token,
    );
    res.json({ success: true, data: data?.monthly ?? [], meta: meta(req) });
  } catch (err) { next(err); }
});

// ── GET /users/admin/reports/summary ─────────────────────────────────────────

adminRouter.get('/reports/summary', authenticate, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.slice(7) ?? '';
    const [totalUsers, vendorStats, paymentStats, topVendorsData, categoryData] = await Promise.all([
      prisma.userProfile.count(),
      internalGet<{ total: number; active: number }>(
        `${config.VENDOR_SERVICE_URL}/vendors/admin/stats`,
        token,
      ),
      internalGet<{ revenueTotal: number; monthly: Array<{ month: string; revenue: number; bookings: number }> }>(
        `${config.PAYMENT_SERVICE_URL}/payments/admin/stats`,
        token,
      ),
      internalGet<{ topVendors: Array<{ vendorId: string; bookingCount: number; revenuePaise: number }> }>(
        `${config.BOOKING_SERVICE_URL}/bookings/admin/top-vendors?limit=5`,
        token,
      ),
      internalGet<{ categoryBreakdown: Array<{ category: string; count: number }> }>(
        `${config.BOOKING_SERVICE_URL}/bookings/admin/category-breakdown`,
        token,
      ),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: paymentStats?.revenueTotal ?? 0,
        platformFees: Math.round((paymentStats?.revenueTotal ?? 0) * 0.1),
        activeVendors: vendorStats?.active ?? 0,
        activeCustomers: totalUsers,
        monthlyRevenue: paymentStats?.monthly ?? [],
        topVendors: topVendorsData?.topVendors ?? [],
        categoryBreakdown: categoryData?.categoryBreakdown ?? [],
      },
      meta: meta(req),
    });
  } catch (err) { next(err); }
});

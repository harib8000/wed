import { Router, Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { NotFoundError, ForbiddenError } from '@wedding-os/shared-errors';
import { prisma } from '../config/database';
import { z } from 'zod';

export const bookingRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

const CreateEnquirySchema = z.object({
  vendorId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventType: z.string(),
  eventCity: z.string().max(100),
  requirements: z.string().max(2000).optional(),
  guestCount: z.number().int().min(1).max(100000).optional(),
  specialNotes: z.string().max(500).optional(),
});

const SendQuoteSchema = z.object({
  quotedAmountPaise: z.number().int().min(100_00), // minimum ₹100
  note: z.string().max(1000).optional(),
});

const CancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ── POST /bookings (create enquiry) ───────────────────────────────────────────

bookingRouter.post('/', authenticate, requireRole('customer', 'admin'), validate(CreateEnquirySchema), async (req, res, next) => {
  try {
    const booking = await bookingService.createEnquiry(req.user!.id, req.body);
    res.status(201).json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── GET /bookings (list mine) ─────────────────────────────────────────────────

bookingRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    let bookings;
    if (req.user!.role === 'vendor') {
      bookings = await bookingService.getVendorBookings(req.user!.id, status);
    } else {
      bookings = await bookingService.getCustomerBookings(req.user!.id, status);
    }
    res.json({ success: true, data: { bookings }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── GET /bookings/:id ─────────────────────────────────────────────────────────

bookingRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) throw new NotFoundError('Booking', req.params.id);
    // Verify access
    if (req.user!.role !== 'admin' && booking.customerId !== req.user!.id && booking.vendorId !== req.user!.id)
      throw new ForbiddenError();
    res.json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /bookings/:id/quote (vendor sends quote) ─────────────────────────────

bookingRouter.post('/:id/quote', authenticate, requireRole('vendor', 'admin'), validate(SendQuoteSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.sendQuote(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /bookings/:id/accept-quote ───────────────────────────────────────────

bookingRouter.post('/:id/accept-quote', authenticate, requireRole('customer'), async (req, res, next) => {
  try {
    const booking = await bookingService.acceptQuote(req.user!.id, req.params.id);
    res.json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /bookings/:id/cancel ─────────────────────────────────────────────────

bookingRouter.post('/:id/cancel', authenticate, validate(CancelSchema), async (req, res, next) => {
  try {
    const role = req.user!.role as 'customer' | 'vendor';
    const booking = await bookingService.cancel(req.user!.id, role, req.params.id, req.body.reason);
    res.json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Internal: confirm after payment ──────────────────────────────────────────

bookingRouter.post('/internal/:id/confirm', async (req, res, next) => {
  try {
    // Internal only — should be protected by network policy (not auth token)
    const booking = await bookingService.confirmBooking(req.params.id, req.body.paymentId);
    res.json({ success: true, data: { booking }, meta: meta(req) });
  } catch (err) { next(err); }
});

bookingRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'booking-service' }));

// ── Admin: list all bookings ──────────────────────────────────────────────────

const AdminListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

bookingRouter.get('/admin/list', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, status } = AdminListSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = status ? { status: status as never } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: { bookings },
      meta: { total, page, limit, pages: Math.ceil(total / limit), ...meta(req) },
    });
  } catch (err) { next(err); }
});

bookingRouter.get('/admin/stats', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const [total, enquiry, confirmed, completed, cancelled] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'ENQUIRY' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);
    res.json({ success: true, data: { total, enquiry, confirmed, completed, cancelled }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Admin: top vendors by booking count ──────────────────────────────────────

bookingRouter.get('/admin/top-vendors', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 5), 20);
    const rows = await prisma.booking.groupBy({
      by: ['vendorId'],
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _count: { id: true },
      _sum: { finalAmountPaise: true, quotedAmountPaise: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    const topVendors = rows.map((r) => ({
      vendorId: r.vendorId,
      bookingCount: r._count.id,
      revenuePaise: r._sum.finalAmountPaise ?? r._sum.quotedAmountPaise ?? 0,
    }));
    res.json({ success: true, data: { topVendors }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Admin: category breakdown ─────────────────────────────────────────────────

bookingRouter.get('/admin/category-breakdown', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const rows = await prisma.booking.groupBy({
      by: ['eventType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const categoryBreakdown = rows.map((r) => ({
      category: r.eventType,
      count: r._count.id,
    }));
    res.json({ success: true, data: { categoryBreakdown }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Vendor: dashboard analytics ───────────────────────────────────────────────

bookingRouter.get('/vendor/dashboard', authenticate, requireRole('vendor'), async (req, res, next) => {
  try {
    const vendorId = req.user!.id;
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [statusCounts, recentBookings, periodBookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ['status'],
        where: { vendorId },
        _count: { id: true },
        _sum: { finalAmountPaise: true, quotedAmountPaise: true },
      }),
      prisma.booking.findMany({
        where: { vendorId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true, bookingNumber: true, status: true, eventDate: true,
          eventType: true, quotedAmountPaise: true, finalAmountPaise: true,
          updatedAt: true, createdAt: true,
        },
      }),
      prisma.booking.findMany({
        where: { vendorId, status: { in: ['CONFIRMED', 'COMPLETED'] }, eventDate: { gte: sixMonthsAgo } },
        select: { eventDate: true, finalAmountPaise: true, quotedAmountPaise: true },
        orderBy: { eventDate: 'asc' },
      }),
    ]);

    const countMap: Record<string, number> = {};
    let totalRevenuePaise = 0;
    for (const r of statusCounts) {
      countMap[r.status] = r._count.id;
      if (r.status === 'CONFIRMED' || r.status === 'COMPLETED') {
        totalRevenuePaise += r._sum.finalAmountPaise ?? r._sum.quotedAmountPaise ?? 0;
      }
    }
    const totalEnquiries = Object.values(countMap).reduce((a, b) => a + b, 0);
    const confirmedCount = (countMap['CONFIRMED'] ?? 0) + (countMap['ADVANCE_PAID'] ?? 0) + (countMap['CHECKIN'] ?? 0);
    const completedCount = countMap['COMPLETED'] ?? 0;
    const quotedCount = countMap['QUOTE_SENT'] ?? 0;
    const cancelledCount = (countMap['CANCELLED_BY_CUSTOMER'] ?? 0) + (countMap['CANCELLED_BY_VENDOR'] ?? 0);
    const activeCount = (countMap['ENQUIRY'] ?? 0) + quotedCount + (countMap['QUOTE_ACCEPTED'] ?? 0) + (countMap['ADVANCE_PENDING'] ?? 0);
    const avgBookingValuePaise = (confirmedCount + completedCount) > 0
      ? Math.round(totalRevenuePaise / (confirmedCount + completedCount))
      : 0;
    const conversionRate = totalEnquiries > 0
      ? Math.round(((confirmedCount + completedCount) / totalEnquiries) * 1000) / 10
      : 0;

    // Build monthly revenue map
    const monthlyMap: Record<string, { revenuePaise: number; bookingCount: number }> = {};
    for (const b of periodBookings) {
      const monthKey = new Date(b.eventDate).toLocaleString('en-US', { month: 'short' });
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenuePaise: 0, bookingCount: 0 };
      monthlyMap[monthKey].revenuePaise += b.finalAmountPaise ?? b.quotedAmountPaise ?? 0;
      monthlyMap[monthKey].bookingCount += 1;
    }
    const monthly = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data }));

    const stats = {
      totalEnquiries,
      quotedCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      activeCount,
      conversionRate,
      avgBookingValuePaise,
    };

    const recentActivity = recentBookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      eventDate: b.eventDate,
      eventType: b.eventType,
      amountPaise: b.finalAmountPaise ?? b.quotedAmountPaise ?? 0,
      updatedAt: b.updatedAt,
    }));

    res.json({ success: true, data: { stats, recentActivity, monthly }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── Vendor: save internal note on booking ─────────────────────────────────────

const VendorNoteSchema = z.object({ note: z.string().max(1000) });

bookingRouter.patch('/:id/vendor-note', authenticate, requireRole('vendor'), validate(VendorNoteSchema), async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw new NotFoundError('Booking', req.params.id);
    if (booking.vendorId !== req.user!.id) throw new ForbiddenError();
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { vendorQuoteNote: req.body.note },
    });
    res.json({ success: true, data: { booking: updated }, meta: meta(req) });
  } catch (err) { next(err); }
});

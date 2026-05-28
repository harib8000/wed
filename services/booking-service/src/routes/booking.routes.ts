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

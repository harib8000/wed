import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { verifyWebhookSignature } from '../utils/signature';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { NotFoundError } from '@wedding-os/shared-errors';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import { z } from 'zod';

export const paymentRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return map[char] ?? '';
});
const formatInvoiceCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'payment', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch { /* Event bus not initialized (e.g., in tests) */ }
}

const CreateOrderSchema = z.object({
  bookingId: z.string().uuid(),
  amountPaise: z.number().int().min(100_00), // ₹100 minimum
  vendorId: z.string().uuid(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const VerifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  bookingId: z.string().uuid(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ── POST /payments/order (create Razorpay order) ──────────────────────────────

paymentRouter.post('/order', authenticate, requireRole('customer'), validate(CreateOrderSchema), async (req, res, next) => {
  try {
    const order = await paymentService.createOrder(req.user!.id, req.body.bookingId, req.body.amountPaise, req.body.vendorId);
    res.status(201).json({ success: true, data: { order }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /payments/verify (after client-side payment completion) ──────────────

paymentRouter.post('/verify', authenticate, requireRole('customer'), validate(VerifySchema), async (req, res, next) => {
  try {
    const payment = await paymentService.verifyAndCapture(req.body);
    res.json({ success: true, data: { payment }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── GET /payments/:id/invoice ─────────────────────────────────────────────────

paymentRouter.get(
  '/:id/invoice',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: { escrowHold: true },
      });

      if (!payment) throw new NotFoundError('Payment', req.params.id);

      if (req.user!.role !== 'admin' && req.user!.id !== payment.customerId && req.user!.id !== payment.vendorId) {
        return res.status(403).json({ success: false, error: { code: 'AUTH_1003', message: 'Unauthorized' } });
      }

      const amount = payment.amountPaise / 100;
      const platformFeePaise = payment.escrowHold?.platformFeePaise ?? Math.round(payment.amountPaise * 0.1);
      const gstPaise = payment.escrowHold?.gstOnFeePaise ?? Math.round(platformFeePaise * 0.18);
      const vendorPayoutPaise = payment.escrowHold?.vendorPayoutPaise ?? payment.amountPaise - platformFeePaise - gstPaise;
      const platformFee = platformFeePaise / 100;
      const gst = gstPaise / 100;
      const vendorPayout = vendorPayoutPaise / 100;
      const statusClass = ['captured', 'refunded', 'failed'].includes(payment.status.toLowerCase())
        ? `status-${payment.status.toLowerCase()}`
        : 'status-default';

      const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - WeddingOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9fafb; color: #1f2937; }
    .invoice { max-width: 800px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #c026d3, #7c3aed); color: white; padding: 32px 40px; }
    .header h1 { font-size: 28px; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 14px; }
    .body { padding: 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; }
    .info-box p { font-size: 14px; line-height: 1.6; }
    .line-items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .line-items th { text-align: left; padding: 12px 16px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .line-items td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .line-items .amount { text-align: right; font-family: monospace; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb; padding-top: 16px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-captured { background: #d1fae5; color: #065f46; }
    .status-refunded { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-default { background: #e5e7eb; color: #374151; }
    .footer { padding: 24px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { background: white; } .invoice { box-shadow: none; margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>💒 WeddingOS</h1>
      <p>Tax Invoice / Payment Receipt</p>
    </div>
    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <h3>Invoice Details</h3>
          <p><strong>Invoice ID:</strong> INV-${payment.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Payment ID:</strong> ${escapeHtml(payment.razorpayPaymentId ?? 'N/A')}</p>
          <p><strong>Order ID:</strong> ${escapeHtml(payment.razorpayOrderId)}</p>
          <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${escapeHtml(payment.status)}</span></p>
        </div>
        <div class="info-box">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${escapeHtml(payment.bookingId)}</p>
          <p><strong>Customer ID:</strong> ${escapeHtml(payment.customerId)}</p>
          <p><strong>Vendor ID:</strong> ${escapeHtml(payment.vendorId)}</p>
          <p><strong>Currency:</strong> ${escapeHtml(payment.currency)}</p>
        </div>
      </div>

      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(payment.description ?? 'Wedding Service Booking')}</td>
            <td class="amount">₹${formatInvoiceCurrency(amount)}</td>
          </tr>
          <tr>
            <td>Platform Fee (10%)</td>
            <td class="amount">₹${formatInvoiceCurrency(platformFee)}</td>
          </tr>
          <tr>
            <td>GST on Platform Fee (18%)</td>
            <td class="amount">₹${formatInvoiceCurrency(gst)}</td>
          </tr>
          <tr>
            <td>Vendor Payout</td>
            <td class="amount">₹${formatInvoiceCurrency(vendorPayout)}</td>
          </tr>
          <tr class="total-row">
            <td>Total Paid</td>
            <td class="amount">₹${formatInvoiceCurrency(amount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center;" class="no-print">
        <button onclick="window.print()" style="background: linear-gradient(135deg, #c026d3, #7c3aed); color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600;">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
    <div class="footer">
      <p>WeddingOS Platform • This is a computer-generated invoice and does not require a signature.</p>
      <p style="margin-top: 4px;">For queries, contact support@weddingos.in</p>
    </div>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(invoiceHtml);
    } catch (err) { next(err); }
  }
);

// ── POST /payments/webhook (Razorpay webhook — raw body required) ─────────────

paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = req.body.toString('utf8');

      if (!verifyWebhookSignature(rawBody, signature)) {
        logger.warn({ signature }, 'Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = JSON.parse(rawBody);
      await paymentService.handleWebhook(event.event, event.payload);

      res.status(200).json({ status: 'ok' });
    } catch (err) { next(err); }
  }
);

// ── POST /payments/:id/refund (admin only) ────────────────────────────────────

paymentRouter.post('/:id/refund', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await paymentService.refund(req.params.id, req.body.reason ?? 'CANCELLATION', req.body.note);
    res.json({ success: true, data: result, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /payments/escrow/:id/release (admin manual release) ──────────────────

paymentRouter.post('/escrow/:id/release', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await paymentService.releaseEscrow(req.params.id);
    res.json({ success: true, data: { escrow: result }, meta: meta(req) });
  } catch (err) { next(err); }
});

paymentRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));

// ── Admin: list all payments ──────────────────────────────────────────────────

const AdminListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

paymentRouter.get('/admin/list', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, status } = AdminListSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = status ? { status: status as never } : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: { payments },
      meta: { total, page, limit, pages: Math.ceil(total / limit), ...meta(req) },
    });
  } catch (err) { next(err); }
});

paymentRouter.get('/admin/stats', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, monthlyRevenue, monthly] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amountPaise: true } }),
      prisma.payment.aggregate({
        where: { status: 'CAPTURED', createdAt: { gte: startOfMonth } },
        _sum: { amountPaise: true },
      }),
      prisma.$queryRaw<Array<{ month: string; revenue: bigint; bookings: bigint }>>`
        SELECT to_char(created_at, 'Mon') AS month,
               SUM(amount_paise) AS revenue,
               COUNT(*) AS bookings
        FROM payments.payments
        WHERE status = 'CAPTURED'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY to_char(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `,
    ]);

    const monthlyData = monthly.map((row: { month: string; revenue: bigint; bookings: bigint }) => ({
      month: row.month,
      revenue: Number(row.revenue),
      bookings: Number(row.bookings),
    }));

    res.json({
      success: true,
      data: {
        revenueTotal: totalRevenue._sum.amountPaise ?? 0,
        revenueThisMonth: monthlyRevenue._sum.amountPaise ?? 0,
        monthly: monthlyData,
      },
      meta: meta(req),
    });
  } catch (err) { next(err); }
});

// ── Vendor: revenue stats ─────────────────────────────────────────────────────

paymentRouter.get('/vendor/stats', authenticate, requireRole('vendor'), async (req, res, next) => {
  try {
    const vendorId = req.user!.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const [todayEarnings, weekEarnings, monthEarnings, totalEarnings, pendingEscrow, recentReleased] = await Promise.all([
      prisma.escrowHold.aggregate({
        where: { vendorId, status: 'RELEASED_TO_VENDOR', releasedAt: { gte: startOfDay } },
        _sum: { vendorPayoutPaise: true },
      }),
      prisma.escrowHold.aggregate({
        where: { vendorId, status: 'RELEASED_TO_VENDOR', releasedAt: { gte: startOfWeek } },
        _sum: { vendorPayoutPaise: true },
      }),
      prisma.escrowHold.aggregate({
        where: { vendorId, status: 'RELEASED_TO_VENDOR', releasedAt: { gte: startOfMonth } },
        _sum: { vendorPayoutPaise: true },
      }),
      prisma.escrowHold.aggregate({
        where: { vendorId, status: 'RELEASED_TO_VENDOR' },
        _sum: { vendorPayoutPaise: true },
      }),
      prisma.escrowHold.aggregate({
        where: { vendorId, status: 'HELD' },
        _sum: { vendorPayoutPaise: true },
      }),
      prisma.escrowHold.findMany({
        where: { vendorId, status: 'RELEASED_TO_VENDOR', releasedAt: { gte: sixMonthsAgo } },
        select: { releasedAt: true, vendorPayoutPaise: true },
        orderBy: { releasedAt: 'asc' },
      }),
    ]);

    // Build monthly revenue map in JS (avoids raw SQL schema dependencies)
    const monthlyMap: Record<string, number> = {};
    for (const hold of recentReleased) {
      if (!hold.releasedAt) continue;
      const key = hold.releasedAt.toLocaleString('en-US', { month: 'short' });
      monthlyMap[key] = (monthlyMap[key] ?? 0) + hold.vendorPayoutPaise;
    }
    const monthly = Object.entries(monthlyMap).map(([month, revenuePaise]) => ({ month, revenuePaise }));

    // Calculate month-over-month growth
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEarnings = await prisma.escrowHold.aggregate({
      where: { vendorId, status: 'RELEASED_TO_VENDOR', releasedAt: { gte: prevMonthStart, lt: startOfMonth } },
      _sum: { vendorPayoutPaise: true },
    });
    const prevMonth = prevMonthEarnings._sum.vendorPayoutPaise ?? 0;
    const thisMonth = monthEarnings._sum.vendorPayoutPaise ?? 0;
    const monthOverMonthGrowth = prevMonth > 0
      ? Math.round(((thisMonth - prevMonth) / prevMonth) * 1000) / 10
      : 0;

    res.json({
      success: true,
      data: {
        todayPaise: todayEarnings._sum.vendorPayoutPaise ?? 0,
        weekPaise: weekEarnings._sum.vendorPayoutPaise ?? 0,
        monthPaise: thisMonth,
        totalPaise: totalEarnings._sum.vendorPayoutPaise ?? 0,
        pendingPaise: pendingEscrow._sum.vendorPayoutPaise ?? 0,
        monthOverMonthGrowth,
        monthly,
      },
      meta: meta(req),
    });
  } catch (err) { next(err); }
});

// ── Admin: disputes ───────────────────────────────────────────────────────────
const DisputeListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

const CreateDisputeSchema = z.object({
  bookingId: z.string().uuid(),
  bookingNumber: z.string().min(1),
  customerId: z.string().uuid(),
  vendorId: z.string().uuid(),
  customerName: z.string().min(1).max(200),
  vendorName: z.string().min(1).max(200),
  reason: z.enum(['no_show', 'poor_quality', 'late_arrival', 'wrong_items', 'overcharging', 'cancellation', 'rude_behaviour', 'incomplete_service']),
  description: z.string().min(10).max(5000),
  evidenceUrls: z.array(z.string()).default([]),
});

const ResolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED_CUSTOMER', 'RESOLVED_VENDOR', 'CLOSED']),
  refundAmountPaise: z.number().int().min(0).optional(),
  adminNotes: z.string().min(1).max(2000),
});

paymentRouter.get('/admin/disputes', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, status } = DisputeListSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = status ? { status: status as never } : {};

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.dispute.count({ where }),
    ]);

    res.json({
      success: true,
      data: { disputes },
      meta: { total, page, limit, pages: Math.ceil(total / limit), ...meta(req) },
    });
  } catch (err) { next(err); }
});

paymentRouter.post('/admin/disputes', authenticate, async (req, res, next) => {
  try {
    const body = CreateDisputeSchema.parse(req.body);
    const dispute = await prisma.dispute.create({ data: body });
    publishEvent('booking.disputed', dispute.bookingId, {
      bookingId: dispute.bookingId,
      disputeId: dispute.id,
      customerId: dispute.customerId,
      vendorId: dispute.vendorId,
      reason: dispute.reason,
      status: dispute.status,
    });
    publishEvent('escrow.disputed', dispute.id, {
      disputeId: dispute.id,
      bookingId: dispute.bookingId,
      customerId: dispute.customerId,
      vendorId: dispute.vendorId,
      reason: dispute.reason,
      status: dispute.status,
    });
    publishEvent('dispute.opened', dispute.id, {
      disputeId: dispute.id,
      bookingId: dispute.bookingId,
      customerId: dispute.customerId,
      vendorId: dispute.vendorId,
      reason: dispute.reason,
      status: dispute.status,
    });
    res.status(201).json({ success: true, data: { dispute }, meta: meta(req) });
  } catch (err) { next(err); }
});

paymentRouter.post('/admin/disputes/:id/resolve', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const body = ResolveDisputeSchema.parse(req.body);
    const dispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status: body.status,
        refundAmountPaise: body.refundAmountPaise,
        adminNotes: body.adminNotes,
        resolvedAt: new Date(),
        resolvedByAdminId: req.user!.id,
      },
    });

    // If resolved in customer's favour, trigger refund on the linked payment
    if (body.status === 'RESOLVED_CUSTOMER' && body.refundAmountPaise && body.refundAmountPaise > 0) {
      const payment = await prisma.payment.findFirst({
        where: { bookingId: dispute.bookingId, status: 'CAPTURED' },
      });
      if (payment) {
        await paymentService.refund(payment.id, 'DISPUTE_RESOLVED_CUSTOMER', body.adminNotes)
          .catch((err: unknown) => logger.warn({ err }, 'Dispute refund failed (non-blocking)'));
      }
    }

    publishEvent('dispute.resolved', dispute.id, {
      disputeId: dispute.id,
      bookingId: dispute.bookingId,
      customerId: dispute.customerId,
      vendorId: dispute.vendorId,
      status: dispute.status,
      refundAmountPaise: dispute.refundAmountPaise ?? null,
      resolvedByAdminId: dispute.resolvedByAdminId ?? null,
    });

    res.json({ success: true, data: { dispute }, meta: meta(req) });
  } catch (err) { next(err); }
});

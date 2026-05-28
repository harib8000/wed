import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { verifyWebhookSignature } from '../utils/signature';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { NotFoundError } from '@wedding-os/shared-errors';
import { z } from 'zod';

export const paymentRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
const formatInvoiceCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

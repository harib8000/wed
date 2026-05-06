import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { verifyWebhookSignature } from '../utils/signature';
import { logger } from '../utils/logger';
import { z } from 'zod';

export const paymentRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

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

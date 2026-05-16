import { prisma } from '../config/database';
import { getRazorpayClient } from '../config/razorpay';
import { escrowReleaseQueue } from '../config/queue';
import { verifyPaymentSignature } from '../utils/signature';
import { logger } from '../utils/logger';
import { config } from '../config';
import { NotFoundError, PaymentVerificationError, ConflictError } from '@wedding-os/shared-errors';
import axios from 'axios';
import { randomUUID } from 'crypto';

function platformFee(amountPaise: number) {
  const fee = Math.round(amountPaise * config.PLATFORM_FEE_PERCENT / 100);
  const gst = Math.round(fee * 0.18);
  return { platformFeePaise: fee, gstOnFeePaise: gst, vendorPayoutPaise: amountPaise - fee - gst };
}

async function notifyBookingService(bookingId: string, paymentId: string) {
  axios.post(`${config.BOOKING_SERVICE_URL}/bookings/internal/${bookingId}/confirm`, { paymentId })
    .catch((err) => logger.warn({ err, bookingId }, 'Failed to notify booking service'));
}

export const paymentService = {
  async createOrder(customerId: string, bookingId: string, amountPaise: number, vendorId: string) {
    // Idempotency key = bookingId + amount
    const idempotencyKey = `${bookingId}_${amountPaise}`;

    // Check for existing order (idempotent)
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing && existing.status !== 'FAILED') return existing;

    const rzp = getRazorpayClient();
    const order = await (rzp.orders.create as any)({
      amount: amountPaise,
      currency: 'INR',
      receipt: `WOS-${bookingId.slice(0, 8)}`,
      notes: { bookingId, customerId, vendorId },
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        customerId,
        vendorId,
        razorpayOrderId: order.id,
        amountPaise,
        status: 'CREATED',
        idempotencyKey,
        description: `Advance payment for booking ${bookingId}`,
      },
    });

    return { ...payment, razorpayOrderId: order.id, razorpayKeyId: config.RAZORPAY_KEY_ID };
  },

  async verifyAndCapture(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    bookingId: string;
    eventDate: string;
  }) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId, eventDate } = data;

    // OWASP: Verify signature before processing
    const valid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) {
      logger.warn({ razorpayOrderId }, 'Invalid payment signature');
      throw new PaymentVerificationError();
    }

    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) throw new NotFoundError('Payment', razorpayOrderId);
    if (payment.status === 'CAPTURED') {
      // Already processed — idempotent response
      return prisma.payment.findUnique({ where: { id: payment.id }, include: { escrowHold: true } });
    }
    if (payment.status !== 'CREATED' && payment.status !== 'PENDING') {
      throw new ConflictError('Payment cannot be captured in current state');
    }

    const { platformFeePaise, gstOnFeePaise, vendorPayoutPaise } = platformFee(payment.amountPaise);

    // Release date: eventDate + N days
    const releaseDate = new Date(eventDate);
    releaseDate.setDate(releaseDate.getDate() + config.ESCROW_RELEASE_DAYS_AFTER_EVENT);

    // Transaction: update payment, create escrow
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'CAPTURED',
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          escrowHold: {
            create: {
              bookingId: payment.bookingId,
              vendorId: payment.vendorId,
              heldAmountPaise: payment.amountPaise,
              platformFeePaise,
              gstOnFeePaise,
              vendorPayoutPaise,
              releaseScheduledAt: releaseDate,
              status: 'HELD',
            },
          },
        },
        include: { escrowHold: true },
      }),
    ]);

    // Schedule escrow release job
    await escrowReleaseQueue.add(
      'release',
      { escrowHoldId: updatedPayment.escrowHold!.id, vendorId: payment.vendorId },
      { delay: releaseDate.getTime() - Date.now(), jobId: `escrow-${updatedPayment.escrowHold!.id}` }
    );

    // Notify booking service to confirm the booking
    await notifyBookingService(bookingId, updatedPayment.id);

    logger.info({ paymentId: updatedPayment.id, bookingId, vendorPayoutPaise, releaseDate }, 'Payment captured and escrow created');

    return updatedPayment;
  },

  async handleWebhook(event: string, payload: any) {
    logger.info({ event }, 'Razorpay webhook received');

    if (event === 'payment.captured') {
      const { order_id, id: paymentId, signature } = payload.payment?.entity ?? {};
      const notes = payload.payment?.entity?.notes ?? {};

      if (order_id && paymentId) {
        const pmt = await prisma.payment.findUnique({ where: { razorpayOrderId: order_id } });
        if (pmt && pmt.status === 'CREATED') {
          // Update status from webhook
          await prisma.payment.update({
            where: { id: pmt.id },
            data: { razorpayPaymentId: paymentId, status: 'CAPTURED', webhookVerified: true, webhookReceivedAt: new Date() },
          });
          logger.info({ orderId: order_id }, 'Status updated via webhook');
        }
      }
    }

    if (event === 'payment.failed') {
      const { order_id } = payload.payment?.entity ?? {};
      if (order_id) {
        await prisma.payment.updateMany({ where: { razorpayOrderId: order_id }, data: { status: 'FAILED' } });
      }
    }
  },

  async releaseEscrow(escrowHoldId: string) {
    const hold = await prisma.escrowHold.findUnique({ where: { id: escrowHoldId } });
    if (!hold || hold.status !== 'HELD') {
      logger.warn({ escrowHoldId }, 'Escrow not held or already processed');
      return;
    }

    // In production: trigger Razorpay payout to vendor bank account
    // For now: mark as released
    const updated = await prisma.escrowHold.update({
      where: { id: escrowHoldId },
      data: { status: 'RELEASED_TO_VENDOR', releasedAt: new Date() },
    });

    logger.info({ escrowHoldId, vendorId: hold.vendorId, vendorPayoutPaise: hold.vendorPayoutPaise }, 'Escrow released to vendor');
    return updated;
  },

  async refund(paymentId: string, reason: string, adminNote?: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { escrowHold: true } });
    if (!payment) throw new NotFoundError('Payment', paymentId);
    if (payment.status !== 'CAPTURED') throw new ConflictError('Payment has not been captured yet');

    // Cancel scheduled escrow release job
    if (payment.escrowHold) {
      const job = await escrowReleaseQueue.getJob(`escrow-${payment.escrowHold.id}`);
      await job?.remove();

      await prisma.escrowHold.update({
        where: { id: payment.escrowHold.id },
        data: { status: 'REFUNDED_TO_CUSTOMER' },
      });
    }

    // Trigger Razorpay refund
    const rzp = getRazorpayClient();
    let razorpayRefundId: string | undefined;
    try {
      const refund = await (rzp.payments.refund as any)(payment.razorpayPaymentId!, {
        amount: payment.amountPaise,
        speed: 'normal',
        notes: { reason },
      });
      razorpayRefundId = refund.id;
    } catch (err) {
      logger.error({ err }, 'Razorpay refund API failed');
    }

    const [updatedPayment, refundRecord] = await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } }),
      prisma.refund.create({
        data: {
          paymentId,
          bookingId: payment.bookingId,
          amountPaise: payment.amountPaise,
          reason: 'CANCELLATION',
          note: adminNote,
          razorpayRefundId,
          status: razorpayRefundId ? 'PROCESSING' : 'PENDING',
        },
      }),
    ]);

    return { payment: updatedPayment, refund: refundRecord };
  },
};

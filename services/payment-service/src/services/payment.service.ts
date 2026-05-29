import { prisma } from '../config/database';
import { getRazorpayClient } from '../config/razorpay';
import { escrowReleaseQueue } from '../config/queue';
import { verifyPaymentSignature } from '../utils/signature';
import { logger } from '../utils/logger';
import { config } from '../config';
import { NotFoundError, PaymentVerificationError, ConflictError } from '@wedding-os/shared-errors';
import { calculatePlatformFee } from '@wedding-os/shared-utils';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import axios from 'axios';
import { randomUUID } from 'crypto';

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'payment', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch { /* Event bus not initialized (e.g., in tests) */ }
}

function platformFee(amountPaise: number) {
  const result = calculatePlatformFee(amountPaise, config.PLATFORM_FEE_PERCENT / 100);
  return { platformFeePaise: result.platformFee, gstOnFeePaise: result.gstOnFee, vendorPayoutPaise: result.vendorPayout };
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
    const order = await (rzp.orders.create as (...args: unknown[]) => Promise<Record<string, unknown>>)({
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
    publishEvent('payment.captured', updatedPayment.id, { paymentId: updatedPayment.id, bookingId, customerId: payment.customerId, vendorId: payment.vendorId, amountPaise: payment.amountPaise });
    publishEvent('escrow.created', updatedPayment.escrowHold!.id, {
      escrowHoldId: updatedPayment.escrowHold!.id,
      paymentId: updatedPayment.id,
      bookingId,
      customerId: payment.customerId,
      vendorId: payment.vendorId,
      heldAmountPaise: payment.amountPaise,
      platformFeePaise,
      gstOnFeePaise,
      vendorPayoutPaise,
      releaseScheduledAt: releaseDate.toISOString(),
    });

    return updatedPayment;
  },

  async handleWebhook(event: string, payload: Record<string, unknown>) {
    logger.info({ event }, 'Razorpay webhook received');

    const paymentEntity = (payload.payment as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined;

    if (event === 'payment.captured') {
      const order_id = paymentEntity?.order_id as string | undefined;
      const paymentId = paymentEntity?.id as string | undefined;

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
      const order_id = paymentEntity?.order_id as string | undefined;
      const paymentId = paymentEntity?.id as string | undefined;
      if (order_id) {
        const pmt = await prisma.payment.findUnique({ where: { razorpayOrderId: order_id } });
        await prisma.payment.updateMany({ where: { razorpayOrderId: order_id }, data: { status: 'FAILED' } });
        if (pmt) {
          publishEvent('payment.failed', pmt.id, {
            paymentId: pmt.id,
            bookingId: pmt.bookingId,
            customerId: pmt.customerId,
            vendorId: pmt.vendorId,
            amountPaise: pmt.amountPaise,
            razorpayOrderId: order_id,
            razorpayPaymentId: paymentId ?? null,
          });
        }
      }
    }
  },

  async releaseEscrow(escrowHoldId: string) {
    const hold = await prisma.escrowHold.findUnique({ where: { id: escrowHoldId } });
    if (!hold || hold.status !== 'HELD') {
      logger.warn({ escrowHoldId }, 'Escrow not held or already processed');
      return;
    }

    // Fetch vendor bank details from vendor-service
    let razorpayPayoutId: string | undefined;
    try {
      const vendorRes = await axios.get<{ data: { vendor: { bankAccountNo?: string; bankIfsc?: string; bankAccountName?: string } } }>(
        `${config.VENDOR_SERVICE_URL}/vendors/internal/${hold.vendorId}/bank-details`,
      );
      const { bankAccountNo, bankIfsc, bankAccountName } = vendorRes.data?.data?.vendor ?? {};

      if (bankAccountNo && bankIfsc && config.RAZORPAY_ACCOUNT_NUMBER) {
        // Create Razorpay payout via X API (Payouts API)
        const rzp = getRazorpayClient();
        const payout = await (rzp as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<Record<string, unknown>>>>)
          .payouts?.create?.({
            account_number: config.RAZORPAY_ACCOUNT_NUMBER,
            fund_account: {
              account_type: 'bank_account',
              bank_account: {
                name: bankAccountName ?? 'Vendor',
                ifsc: bankIfsc,
                account_number: bankAccountNo,
              },
              contact: {
                name: bankAccountName ?? 'Vendor',
                type: 'vendor',
                reference_id: hold.vendorId,
              },
            },
            amount: hold.vendorPayoutPaise,
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: `escrow-${escrowHoldId}`,
            narration: `WeddingOS payout ${hold.bookingId.slice(0, 8)}`,
          }) as Record<string, unknown>;
        razorpayPayoutId = payout?.id as string | undefined;
        logger.info({ escrowHoldId, razorpayPayoutId, vendorId: hold.vendorId }, 'Razorpay payout initiated');
      } else {
        logger.warn({ escrowHoldId, vendorId: hold.vendorId }, 'Vendor bank details incomplete — skipping Razorpay payout');
      }
    } catch (err) {
      logger.error({ err, escrowHoldId }, 'Razorpay payout failed — marking escrow released anyway');
    }

    const updated = await prisma.escrowHold.update({
      where: { id: escrowHoldId },
      data: {
        status: 'RELEASED_TO_VENDOR',
        releasedAt: new Date(),
        ...(razorpayPayoutId ? { razorpayPayoutId } : {}),
      },
    });

    logger.info({ escrowHoldId, vendorId: hold.vendorId, vendorPayoutPaise: hold.vendorPayoutPaise, razorpayPayoutId }, 'Escrow released to vendor');
    publishEvent('escrow.released', escrowHoldId, { escrowHoldId, vendorId: hold.vendorId, vendorPayoutPaise: hold.vendorPayoutPaise, bookingId: hold.bookingId });
    publishEvent('payout.processed', escrowHoldId, { escrowHoldId, vendorId: hold.vendorId, vendorPayoutPaise: hold.vendorPayoutPaise, razorpayPayoutId: razorpayPayoutId ?? null });
    return updated;
  },

  async refund(paymentId: string, reason: string, adminNote?: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { escrowHold: true } });
    if (!payment) throw new NotFoundError('Payment', paymentId);
    if (payment.status === 'REFUNDED') {
      // Idempotent: already refunded — return existing refund record
      const existingRefund = await prisma.refund.findFirst({ where: { paymentId } });
      return { payment, refund: existingRefund };
    }
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
      const refund = await (rzp.payments.refund as (...args: unknown[]) => Promise<Record<string, unknown>>)(payment.razorpayPaymentId!, {
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

    publishEvent('payment.refunded', paymentId, {
      paymentId,
      bookingId: payment.bookingId,
      customerId: payment.customerId,
      vendorId: payment.vendorId,
      amountPaise: payment.amountPaise,
      razorpayRefundId: razorpayRefundId ?? null,
    });

    return { payment: updatedPayment, refund: refundRecord };
  },
};

import { NotFoundError, PaymentVerificationError, ConflictError } from '@wedding-os/shared-errors';

jest.mock('../../src/config/database', () => ({
  prisma: {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    escrowHold: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockRzpInstance = {
  orders: { create: jest.fn() },
  payments: { refund: jest.fn() },
};

jest.mock('../../src/config/razorpay', () => ({
  getRazorpayClient: jest.fn(() => mockRzpInstance),
}));

jest.mock('../../src/config/queue', () => ({
  escrowReleaseQueue: { add: jest.fn(), getJob: jest.fn() },
}));

jest.mock('../../src/utils/signature', () => ({
  verifyPaymentSignature: jest.fn(),
}));

jest.mock('../../src/config', () => ({
  config: {
    RAZORPAY_KEY_ID: 'rzp_test_key',
    RAZORPAY_KEY_SECRET: 'test_secret',
    PLATFORM_FEE_PERCENT: 10,
    ESCROW_RELEASE_DAYS_AFTER_EVENT: 7,
    BOOKING_SERVICE_URL: 'http://booking-service:4004',
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('axios', () => ({ post: jest.fn().mockResolvedValue({}) }));

import { prisma } from '../../src/config/database';
import { getRazorpayClient } from '../../src/config/razorpay';
import { escrowReleaseQueue } from '../../src/config/queue';
import { verifyPaymentSignature } from '../../src/utils/signature';
import { paymentService } from '../../src/services/payment.service';

describe('paymentService', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRzp = mockRzpInstance;

  // ── createOrder ──────────────────────────────────────────────

  describe('createOrder', () => {
    it('should create Razorpay order and payment record', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
      (mockRzp.orders.create as jest.Mock).mockResolvedValue({ id: 'order_abc' });

      const paymentRecord = {
        id: 'pay-1',
        bookingId: 'b-1',
        customerId: 'c-1',
        vendorId: 'v-1',
        razorpayOrderId: 'order_abc',
        amountPaise: 50000,
        status: 'CREATED',
        idempotencyKey: 'b-1_50000',
        description: 'Advance payment for booking b-1',
      };
      (prisma.payment.create as jest.Mock).mockResolvedValue(paymentRecord);

      const result = await paymentService.createOrder('c-1', 'b-1', 50000, 'v-1');

      expect(mockRzp.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50000, currency: 'INR' }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bookingId: 'b-1', status: 'CREATED' }),
        }),
      );
      expect(result).toMatchObject({ razorpayOrderId: 'order_abc', razorpayKeyId: 'rzp_test_key' });
    });

    it('should return existing payment for same idempotency key', async () => {
      const existing = { id: 'pay-existing', status: 'CREATED', idempotencyKey: 'b-1_50000' };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(existing);

      const result = await paymentService.createOrder('c-1', 'b-1', 50000, 'v-1');

      expect(result).toBe(existing);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  // ── verifyAndCapture ─────────────────────────────────────────

  describe('verifyAndCapture', () => {
    const captureData = {
      razorpayOrderId: 'order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig_1',
      bookingId: 'b-1',
      eventDate: '2025-12-01',
    };

    it('should throw PaymentVerificationError on invalid signature', async () => {
      (verifyPaymentSignature as jest.Mock).mockReturnValue(false);

      await expect(paymentService.verifyAndCapture(captureData)).rejects.toThrow(PaymentVerificationError);
    });

    it('should throw NotFoundError if payment not found', async () => {
      (verifyPaymentSignature as jest.Mock).mockReturnValue(true);
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(paymentService.verifyAndCapture(captureData)).rejects.toThrow(NotFoundError);
    });

    it('should return idempotent response if payment already captured', async () => {
      (verifyPaymentSignature as jest.Mock).mockReturnValue(true);
      const captured = { id: 'pay-1', status: 'CAPTURED', razorpayOrderId: 'order_1' };
      const withEscrow = { ...captured, escrowHold: { id: 'esc-1' } };

      (prisma.payment.findUnique as jest.Mock)
        .mockResolvedValueOnce(captured)
        .mockResolvedValueOnce(withEscrow);

      const result = await paymentService.verifyAndCapture(captureData);

      expect(result).toEqual(withEscrow);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should capture payment and create escrow', async () => {
      (verifyPaymentSignature as jest.Mock).mockReturnValue(true);

      const payment = {
        id: 'pay-1',
        bookingId: 'b-1',
        vendorId: 'v-1',
        amountPaise: 100000,
        status: 'CREATED',
        razorpayOrderId: 'order_1',
      };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(payment);

      const updatedPayment = {
        ...payment,
        status: 'CAPTURED',
        escrowHold: { id: 'esc-1', vendorId: 'v-1' },
      };
      (prisma.$transaction as jest.Mock).mockImplementation(async (ops) => Promise.all(ops));
      (prisma.payment.update as jest.Mock).mockResolvedValue(updatedPayment);

      const result = await paymentService.verifyAndCapture(captureData);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: 'CAPTURED' }),
        }),
      );
      expect(escrowReleaseQueue.add).toHaveBeenCalledWith(
        'release',
        expect.objectContaining({ escrowHoldId: 'esc-1' }),
        expect.objectContaining({ jobId: 'escrow-esc-1' }),
      );
      expect(result).toEqual(updatedPayment);
    });
  });

  // ── releaseEscrow ────────────────────────────────────────────

  describe('releaseEscrow', () => {
    it('should update escrow status to RELEASED_TO_VENDOR', async () => {
      const hold = { id: 'esc-1', status: 'HELD', vendorId: 'v-1', vendorPayoutPaise: 80000 };
      (prisma.escrowHold.findUnique as jest.Mock).mockResolvedValue(hold);

      const updated = { ...hold, status: 'RELEASED_TO_VENDOR', releasedAt: new Date() };
      (prisma.escrowHold.update as jest.Mock).mockResolvedValue(updated);

      const result = await paymentService.releaseEscrow('esc-1');

      expect(prisma.escrowHold.update).toHaveBeenCalledWith({
        where: { id: 'esc-1' },
        data: expect.objectContaining({ status: 'RELEASED_TO_VENDOR' }),
      });
      expect(result).toEqual(updated);
    });

    it('should skip if already processed', async () => {
      (prisma.escrowHold.findUnique as jest.Mock).mockResolvedValue({ id: 'esc-1', status: 'RELEASED_TO_VENDOR' });

      const result = await paymentService.releaseEscrow('esc-1');

      expect(result).toBeUndefined();
      expect(prisma.escrowHold.update).not.toHaveBeenCalled();
    });
  });

  // ── refund ───────────────────────────────────────────────────

  describe('refund', () => {
    it('should throw NotFoundError if payment not found', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(paymentService.refund('pay-999', 'cancel')).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if payment not captured', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ id: 'pay-1', status: 'CREATED' });

      await expect(paymentService.refund('pay-1', 'cancel')).rejects.toThrow(ConflictError);
    });

    it('should create refund record and update payment', async () => {
      const payment = {
        id: 'pay-1',
        bookingId: 'b-1',
        vendorId: 'v-1',
        amountPaise: 100000,
        status: 'CAPTURED',
        razorpayPaymentId: 'rzp_pay_1',
        escrowHold: { id: 'esc-1' },
      };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(payment);
      (escrowReleaseQueue.getJob as jest.Mock).mockResolvedValue({ remove: jest.fn() });

      (mockRzp.payments.refund as jest.Mock).mockResolvedValue({ id: 'rfnd_1' });

      const updatedPayment = { ...payment, status: 'REFUNDED' };
      const refundRecord = { id: 'ref-1', paymentId: 'pay-1', status: 'PROCESSING' };

      (prisma.$transaction as jest.Mock).mockImplementation(async (ops) => Promise.all(ops));
      (prisma.payment.update as jest.Mock).mockResolvedValue(updatedPayment);
      (prisma.refund.create as jest.Mock).mockResolvedValue(refundRecord);

      const result = await paymentService.refund('pay-1', 'cancel', 'Admin note');

      expect(prisma.escrowHold.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REFUNDED_TO_CUSTOMER' } }),
      );
      expect(mockRzp.payments.refund).toHaveBeenCalledWith('rzp_pay_1', expect.objectContaining({ amount: 100000 }));
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REFUNDED' } }),
      );
      expect(result).toEqual({ payment: updatedPayment, refund: refundRecord });
    });
  });

  // ── handleWebhook ────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('should update payment status on payment.captured event', async () => {
      const pmt = { id: 'pay-1', status: 'CREATED', razorpayOrderId: 'order_1' };
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(pmt);

      await paymentService.handleWebhook('payment.captured', {
        payment: { entity: { order_id: 'order_1', id: 'rzp_pay_1' } },
      });

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: 'CAPTURED', razorpayPaymentId: 'rzp_pay_1' }),
        }),
      );
    });

    it('should mark payment as FAILED on payment.failed event', async () => {
      await paymentService.handleWebhook('payment.failed', {
        payment: { entity: { order_id: 'order_1' } },
      });

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { razorpayOrderId: 'order_1' },
        data: { status: 'FAILED' },
      });
    });
  });
});

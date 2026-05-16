import {
  NotFoundError,
  ForbiddenError,
  BookingAlreadyConfirmedError,
  BookingCancellationError,
} from '@wedding-os/shared-errors';

// ── Mocks (must be before imports of the module under test) ──────────────────

jest.mock('../../src/config/database', () => ({
  prisma: {
    booking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
}));

jest.mock('../../src/config', () => ({
  config: {
    VENDOR_SERVICE_URL: 'http://vendor-service:4003',
    NOTIFICATION_SERVICE_URL: 'http://notification-service:4008',
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@wedding-os/shared-utils', () => ({
  generateBookingNumber: jest.fn(() => 'WED-20240101-ABC123'),
}));

import { prisma } from '../../src/config/database';
import { bookingService, calculateFees } from '../../src/services/booking.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    bookingNumber: 'WED-20240101-ABC123',
    customerId: 'customer-1',
    vendorId: 'vendor-1',
    packageId: 'pkg-1',
    status: 'ENQUIRY',
    eventDate: new Date('2025-03-15'),
    eventType: 'WEDDING',
    eventCity: 'Mumbai',
    requirements: null,
    guestCount: 200,
    specialNotes: null,
    quotedAmountPaise: null,
    advanceAmountPaise: null,
    finalAmountPaise: null,
    platformFeePaise: null,
    gstOnFeePaise: null,
    vendorQuoteNote: null,
    quoteSentAt: null,
    quoteAcceptedAt: null,
    confirmedAt: null,
    cancellationReason: null,
    cancelledAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('calculateFees', () => {
  it('should calculate platform fee, GST, and advance correctly', () => {
    const result = calculateFees(100_000); // ₹1,000 in paise
    expect(result.platformFeePaise).toBe(10_000);   // 10%
    expect(result.gstOnFeePaise).toBe(1_800);        // 18% of fee
    expect(result.advancePaise).toBe(30_000);         // 30%
    expect(result.finalAmountPaise).toBe(100_000);
  });

  it('should round to nearest paise', () => {
    const result = calculateFees(33_333);
    expect(result.platformFeePaise).toBe(3_333);
    expect(result.gstOnFeePaise).toBe(600);  // Math.round(3333 * 0.18) = 600
    expect(result.advancePaise).toBe(10_000); // Math.round(33333 * 0.30) = 10000
  });
});

describe('bookingService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createEnquiry ────────────────────────────────────────────────────────

  describe('createEnquiry', () => {
    it('should create a booking with ENQUIRY status', async () => {
      const created = makeBooking();
      (mockPrisma.booking.create as jest.Mock).mockResolvedValue(created);

      const result = await bookingService.createEnquiry('customer-1', {
        vendorId: 'vendor-1',
        packageId: 'pkg-1',
        eventDate: '2025-03-15',
        eventType: 'WEDDING',
        eventCity: 'Mumbai',
        guestCount: 200,
      });

      expect(result).toEqual(created);
      expect(mockPrisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'customer-1',
            vendorId: 'vendor-1',
            status: 'ENQUIRY',
            eventType: 'WEDDING',
            eventCity: 'Mumbai',
          }),
        }),
      );
    });
  });

  // ── sendQuote ────────────────────────────────────────────────────────────

  describe('sendQuote', () => {
    it('should throw NotFoundError if booking not found', async () => {
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.sendQuote('vendor-1', 'missing-id', { quotedAmountPaise: 100_000 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update booking with quote details', async () => {
      const booking = makeBooking();
      const updated = makeBooking({ status: 'QUOTE_SENT', quotedAmountPaise: 100_000 });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue(updated);

      const result = await bookingService.sendQuote('vendor-1', 'booking-1', {
        quotedAmountPaise: 100_000,
        note: 'Includes decoration',
      });

      expect(result.status).toBe('QUOTE_SENT');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1', version: 1 },
          data: expect.objectContaining({
            status: 'QUOTE_SENT',
            quotedAmountPaise: 100_000,
            advanceAmountPaise: 30_000,
            platformFeePaise: 10_000,
            gstOnFeePaise: 1_800,
            vendorQuoteNote: 'Includes decoration',
          }),
        }),
      );
    });
  });

  // ── acceptQuote ──────────────────────────────────────────────────────────

  describe('acceptQuote', () => {
    it('should throw NotFoundError if booking not found', async () => {
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.acceptQuote('customer-1', 'missing-id'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update status to ADVANCE_PENDING', async () => {
      const booking = makeBooking({ status: 'QUOTE_SENT', advanceAmountPaise: 30_000 });
      const updated = makeBooking({ status: 'ADVANCE_PENDING' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue(updated);

      const result = await bookingService.acceptQuote('customer-1', 'booking-1');

      expect(result.status).toBe('ADVANCE_PENDING');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ADVANCE_PENDING' }),
        }),
      );
    });
  });

  // ── confirmBooking ───────────────────────────────────────────────────────

  describe('confirmBooking', () => {
    it('should throw BookingAlreadyConfirmedError if not ADVANCE_PENDING', async () => {
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.confirmBooking('booking-1', 'pay-1'),
      ).rejects.toThrow(BookingAlreadyConfirmedError);
    });

    it('should update status to CONFIRMED', async () => {
      const booking = makeBooking({ status: 'ADVANCE_PENDING' });
      const updated = makeBooking({ status: 'CONFIRMED' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue(updated);

      const result = await bookingService.confirmBooking('booking-1', 'pay-1');

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CONFIRMED',
            events: expect.objectContaining({
              create: expect.objectContaining({
                eventType: 'BOOKING_CONFIRMED',
                payload: { paymentId: 'pay-1' },
              }),
            }),
          }),
        }),
      );
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should throw NotFoundError if booking not found', async () => {
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.cancel('customer-1', 'customer', 'missing-id'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if customer does not own booking', async () => {
      const booking = makeBooking({ customerId: 'other-customer' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);

      await expect(
        bookingService.cancel('customer-1', 'customer', 'booking-1'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if vendor does not own booking', async () => {
      const booking = makeBooking({ vendorId: 'other-vendor' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);

      await expect(
        bookingService.cancel('vendor-1', 'vendor', 'booking-1'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BookingCancellationError for non-cancellable status', async () => {
      const booking = makeBooking({ status: 'COMPLETED', customerId: 'customer-1' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);

      await expect(
        bookingService.cancel('customer-1', 'customer', 'booking-1'),
      ).rejects.toThrow(BookingCancellationError);
    });

    it('should cancel booking with CANCELLED_BY_CUSTOMER status', async () => {
      const booking = makeBooking({ status: 'ENQUIRY', customerId: 'customer-1' });
      const updated = makeBooking({ status: 'CANCELLED_BY_CUSTOMER' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue(updated);

      const result = await bookingService.cancel('customer-1', 'customer', 'booking-1', 'Changed plans');

      expect(result.status).toBe('CANCELLED_BY_CUSTOMER');
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED_BY_CUSTOMER',
            cancellationReason: 'Changed plans',
          }),
        }),
      );
    });

    it('should cancel booking with CANCELLED_BY_VENDOR status', async () => {
      const booking = makeBooking({ status: 'CONFIRMED', vendorId: 'vendor-1' });
      const updated = makeBooking({ status: 'CANCELLED_BY_VENDOR' });
      (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(booking);
      (mockPrisma.booking.update as jest.Mock).mockResolvedValue(updated);

      const result = await bookingService.cancel('vendor-1', 'vendor', 'booking-1', 'Unavailable');

      expect(result.status).toBe('CANCELLED_BY_VENDOR');
    });
  });

  // ── getCustomerBookings ──────────────────────────────────────────────────

  describe('getCustomerBookings', () => {
    it('should return customer bookings', async () => {
      const bookings = [makeBooking(), makeBooking({ id: 'booking-2' })];
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue(bookings);

      const result = await bookingService.getCustomerBookings('customer-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter by status when provided', async () => {
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      await bookingService.getCustomerBookings('customer-1', 'CONFIRMED');

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', status: 'CONFIRMED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  // ── getVendorBookings ────────────────────────────────────────────────────

  describe('getVendorBookings', () => {
    it('should return vendor bookings ordered by event date', async () => {
      const bookings = [makeBooking()];
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue(bookings);

      const result = await bookingService.getVendorBookings('vendor-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        orderBy: { eventDate: 'asc' },
        take: 50,
      });
    });
  });

  // ── getBooking ───────────────────────────────────────────────────────────

  describe('getBooking', () => {
    it('should return booking with events included', async () => {
      const booking = makeBooking();
      (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

      const result = await bookingService.getBooking('booking-1');

      expect(result).toEqual(booking);
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        include: { events: { orderBy: { createdAt: 'asc' } } },
      });
    });
  });
});

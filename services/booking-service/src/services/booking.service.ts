import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config';
import { NotFoundError, ForbiddenError, BookingAlreadyConfirmedError, BookingCancellationError } from '@wedding-os/shared-errors';
import { generateBookingNumber } from '@wedding-os/shared-utils';

// ── Fee calculation ────────────────────────────────────────────────────────────

export function calculateFees(quotedPaise: number) {
  const platformFeePaise = Math.round(quotedPaise * 0.10);
  const gstOnFeePaise = Math.round(platformFeePaise * 0.18);
  const advancePaise = Math.round(quotedPaise * 0.30); // 30% advance
  return { platformFeePaise, gstOnFeePaise, advancePaise, finalAmountPaise: quotedPaise };
}

// ── Notify helper ─────────────────────────────────────────────────────────────

async function notify(event: string, payload: object) {
  axios.post(`${config.NOTIFICATION_SERVICE_URL}/internal/notify`, { event, payload })
    .catch((err) => logger.warn({ err, event }, 'Notification failed (non-blocking)'));
}

export const bookingService = {
  async createEnquiry(customerId: string, data: {
    vendorId: string;
    packageId?: string;
    eventDate: string;
    eventType: string;
    eventCity: string;
    requirements?: string;
    guestCount?: number;
    specialNotes?: string;
  }) {
    // Check vendor availability via vendor-service
    try {
      await axios.get(`${config.VENDOR_SERVICE_URL}/vendors/availability-check`, {
        params: { vendorId: data.vendorId, date: data.eventDate },
      });
    } catch {
      // If vendor service unavailable, still allow enquiry (optimistic)
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        customerId,
        vendorId: data.vendorId,
        packageId: data.packageId,
        status: 'ENQUIRY',
        eventDate: new Date(data.eventDate),
        eventType: data.eventType as any,
        eventCity: data.eventCity,
        requirements: data.requirements,
        guestCount: data.guestCount,
        specialNotes: data.specialNotes,
        events: {
          create: {
            eventType: 'ENQUIRY_CREATED',
            actorId: customerId,
            actorRole: 'customer',
            payload: { vendorId: data.vendorId },
          },
        },
      },
    });

    await notify('booking.enquiry_created', { bookingId: booking.id, vendorId: data.vendorId, customerId });
    return booking;
  },

  async sendQuote(vendorId: string, bookingId: string, data: {
    quotedAmountPaise: number;
    note?: string;
  }) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, vendorId, status: 'ENQUIRY' } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    const { platformFeePaise, gstOnFeePaise, advancePaise, finalAmountPaise } = calculateFees(data.quotedAmountPaise);

    const updated = await prisma.booking.update({
      where: { id: bookingId, version: booking.version }, // optimistic lock
      data: {
        status: 'QUOTE_SENT',
        quotedAmountPaise: data.quotedAmountPaise,
        advanceAmountPaise: advancePaise,
        finalAmountPaise,
        platformFeePaise,
        gstOnFeePaise,
        vendorQuoteNote: data.note,
        quoteSentAt: new Date(),
        version: { increment: 1 },
        events: { create: { eventType: 'QUOTE_SENT', actorId: vendorId, actorRole: 'vendor', payload: { quotedAmountPaise: data.quotedAmountPaise } } },
      },
    });

    await notify('booking.quote_sent', { bookingId: updated.id, customerId: booking.customerId, quotedAmountPaise: data.quotedAmountPaise });
    return updated;
  },

  async acceptQuote(customerId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, customerId, status: 'QUOTE_SENT' } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    const updated = await prisma.booking.update({
      where: { id: bookingId, version: booking.version },
      data: {
        status: 'ADVANCE_PENDING',
        quoteAcceptedAt: new Date(),
        version: { increment: 1 },
        events: { create: { eventType: 'QUOTE_ACCEPTED', actorId: customerId, actorRole: 'customer', payload: {} } },
      },
    });

    await notify('booking.quote_accepted', { bookingId: updated.id, vendorId: booking.vendorId, advanceAmountPaise: booking.advanceAmountPaise });
    return updated;
  },

  async confirmBooking(bookingId: string, paymentId: string) {
    // Called by payment-service after advance captured
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, status: 'ADVANCE_PENDING' } });
    if (!booking) throw new BookingAlreadyConfirmedError();

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        version: { increment: 1 },
        events: { create: { eventType: 'BOOKING_CONFIRMED', actorId: 'system', actorRole: 'system', payload: { paymentId } } },
      },
    });

    await notify('booking.confirmed', { bookingId: updated.id, customerId: booking.customerId, vendorId: booking.vendorId });
    return updated;
  },

  async cancel(actorId: string, actorRole: 'customer' | 'vendor', bookingId: string, reason?: string) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    // Validate actor owns this booking
    if (actorRole === 'customer' && booking.customerId !== actorId)
      throw new ForbiddenError();
    if (actorRole === 'vendor' && booking.vendorId !== actorId)
      throw new ForbiddenError();

    const cancellableStatuses = ['ENQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'ADVANCE_PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(booking.status))
      throw new BookingCancellationError('Booking cannot be cancelled in current state');

    const statusMap = { customer: 'CANCELLED_BY_CUSTOMER', vendor: 'CANCELLED_BY_VENDOR' } as const;
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: statusMap[actorRole] as any,
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
        events: { create: { eventType: 'BOOKING_CANCELLED', actorId, actorRole, payload: { reason } } },
      },
    });

    await notify('booking.cancelled', { bookingId, actorRole, reason });
    return updated;
  },

  async getCustomerBookings(customerId: string, status?: string) {
    return prisma.booking.findMany({
      where: { customerId, ...(status && { status: status as any }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async getVendorBookings(vendorId: string, status?: string) {
    return prisma.booking.findMany({
      where: { vendorId, ...(status && { status: status as any }) },
      orderBy: { eventDate: 'asc' },
      take: 50,
    });
  },

  async getBooking(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
  },
};

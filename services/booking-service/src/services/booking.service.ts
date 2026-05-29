import { prisma } from '../config/database';
import type { BookingStatus, EventType } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config';
import { NotFoundError, ForbiddenError, BookingAlreadyConfirmedError, BookingCancellationError, ConflictError } from '@wedding-os/shared-errors';
import { generateBookingNumber } from '@wedding-os/shared-utils';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import { Prisma } from '@prisma/client';

// ── Event publishing helper ────────────────────────────────────────────────────

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'booking', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch { /* Event bus not initialized (e.g., in tests) */ }
}

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
        eventType: data.eventType as EventType,
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
    publishEvent('booking.enquiry_created', booking.id, { bookingId: booking.id, vendorId: data.vendorId, customerId, eventType: data.eventType });
    return booking;
  },

  async sendQuote(vendorId: string, bookingId: string, data: {
    quotedAmountPaise: number;
    note?: string;
  }) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, vendorId, status: 'ENQUIRY' } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    const { platformFeePaise, gstOnFeePaise, advancePaise, finalAmountPaise } = calculateFees(data.quotedAmountPaise);

    let updated;
    try {
      updated = await prisma.booking.update({
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
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ConflictError('Booking was modified concurrently. Please retry.');
      }
      throw err;
    }

    await notify('booking.quote_sent', { bookingId: updated.id, customerId: booking.customerId, quotedAmountPaise: data.quotedAmountPaise });
    publishEvent('booking.quote_sent', updated.id, { bookingId: updated.id, vendorId, customerId: booking.customerId, quotedAmountPaise: data.quotedAmountPaise });
    return updated;
  },

  async acceptQuote(customerId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, customerId, status: 'QUOTE_SENT' } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    let updated;
    try {
      updated = await prisma.booking.update({
        where: { id: bookingId, version: booking.version },
        data: {
          status: 'ADVANCE_PENDING',
          quoteAcceptedAt: new Date(),
          version: { increment: 1 },
          events: { create: { eventType: 'QUOTE_ACCEPTED', actorId: customerId, actorRole: 'customer', payload: {} } },
        },
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ConflictError('Booking was modified concurrently. Please retry.');
      }
      throw err;
    }

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
    publishEvent('booking.confirmed', updated.id, { bookingId: updated.id, customerId: booking.customerId, vendorId: booking.vendorId, paymentId });
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

    const statusMap: Record<string, BookingStatus> = { customer: 'CANCELLED_BY_CUSTOMER' as BookingStatus, vendor: 'CANCELLED_BY_VENDOR' as BookingStatus };
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: statusMap[actorRole],
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
        events: { create: { eventType: 'BOOKING_CANCELLED', actorId, actorRole, payload: { reason } } },
      },
    });

    await notify('booking.cancelled', { bookingId, actorRole, reason });
    publishEvent('booking.cancelled', bookingId, { bookingId, actorId, actorRole, reason: reason ?? '', customerId: booking.customerId, vendorId: booking.vendorId });
    return updated;
  },

  async completeBooking(bookingId: string, actorId: string, actorRole: 'admin' | 'system') {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, status: 'CONFIRMED' } });
    if (!booking) throw new NotFoundError('Booking', bookingId);

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED' as BookingStatus,
        version: { increment: 1 },
        events: { create: { eventType: 'BOOKING_COMPLETED', actorId, actorRole, payload: {} } },
      },
    });

    await notify('booking.completed', { bookingId: updated.id, customerId: booking.customerId, vendorId: booking.vendorId });
    publishEvent('booking.completed', updated.id, { bookingId: updated.id, customerId: booking.customerId, vendorId: booking.vendorId });
    return updated;
  },

  async getCustomerBookings(customerId: string, status?: string) {
    return prisma.booking.findMany({
      where: { customerId, ...(status && { status: status as BookingStatus }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async getVendorBookings(vendorId: string, status?: string) {
    return prisma.booking.findMany({
      where: { vendorId, ...(status && { status: status as BookingStatus }) },
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

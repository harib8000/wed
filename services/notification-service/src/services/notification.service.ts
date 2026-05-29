import { prisma } from '../config/database';
import { notificationQueue, startNotificationWorker } from '../config/queue';
import { sendPushNotification } from '../utils/fcm';
import { sendSms, sendWhatsApp } from '../utils/sms';
import { sendEmail } from '../channels/email.channel';
import { logger } from '../utils/logger';
import { NotFoundError } from '@wedding-os/shared-errors';
import type { NotificationItem } from '@wedding-os/shared-types';

export interface NotifyPayload {
  userId: string;
  phone?: string;
  pushTokens?: string[];
  email?: string;
  channels: ('PUSH' | 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP')[];
  event: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const notificationService = {
  async enqueue(payload: NotifyPayload) {
    await notificationQueue.add('send', payload);
  },

  async send(payload: NotifyPayload) {
    const { userId, phone, pushTokens, channels, event, title, body, data } = payload;

    for (const channel of channels) {
      const log = await prisma.notificationLog.create({
        data: { userId, channel, event, title, body, data: data ?? {}, status: 'QUEUED' },
      });

      try {
        let providerRef: string | undefined;

        if (channel === 'PUSH' && pushTokens?.length) {
          for (const token of pushTokens) {
            providerRef = await sendPushNotification(token, title, body, data);
          }
        } else if (channel === 'SMS' && phone) {
          providerRef = await sendSms(phone, body);
        } else if (channel === 'WHATSAPP' && phone) {
          providerRef = await sendWhatsApp(phone, event.replace(/\./g, '_'), [title, body]);
        } else if (channel === 'EMAIL' && payload.email) {
          providerRef = await sendEmail({
            to: payload.email,
            subject: title,
            templateName: event.replace(/\./g, '_'),
            templateVars: { title, body, ...(data ?? {}) },
            text: body,
          });
        } else if (channel === 'IN_APP') {
          // In-app is stored in DB as NotificationLog and fetched by frontend via polling or WS
          providerRef = log.id;
        }

        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'SENT', providerRef, sentAt: new Date() },
        });
      } catch (err: unknown) {
        logger.error({ err, channel, userId, event }, 'Notification delivery failed');
        const errorMsg = err instanceof Error ? err.message?.slice(0, 500) : String(err).slice(0, 500);
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'FAILED', errorMsg },
        });
      }
    }
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notificationLog.findFirst({
      where: { id: notificationId, userId, channel: 'IN_APP' },
    });
    if (!notification) return null;
    return prisma.notificationLog.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string) {
    const result = await prisma.notificationLog.updateMany({
      where: { userId, channel: 'IN_APP', readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  },

  async getUnread(userId: string, limit = 20) {
    return prisma.notificationLog.findMany({
      where: { userId, channel: 'IN_APP', status: { in: ['SENT', 'QUEUED'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  startWorker() {
    return startNotificationWorker(async (job) => {
      const payload = job.data as NotifyPayload;
      await this.send(payload);
    });
  },

  // ── Internal endpoint called by other services ─────────────────────────────
  async handleEvent(event: string, eventPayload: Record<string, unknown>) {
    const s = (v: unknown): string => String(v ?? '');
    const n = (v: unknown): number => Number(v) || 0;

    // Event routing — each event type maps to notification recipients
    const mapping: Record<string, (p: Record<string, unknown>) => NotifyPayload[]> = {
      'booking.enquiry_created': (p) => [{
        userId: s(p.vendorId),
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'New Booking Enquiry!',
        body: `You have a new booking enquiry. Please review and respond.`,
        data: { bookingId: s(p.bookingId) },
      }],
      'booking.quote_sent': (p) => [{
        userId: s(p.customerId),
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'Quote Received',
        body: `Your vendor has sent a quote. Review it now.`,
        data: { bookingId: s(p.bookingId) },
      }],
      'booking.confirmed': (p) => [
        { userId: s(p.customerId), channels: ['PUSH', 'SMS', 'IN_APP'], event, title: 'Booking Confirmed! 🎉', body: `Your wedding booking is confirmed. Check your timeline.`, data: { bookingId: s(p.bookingId) } },
        { userId: s(p.vendorId), channels: ['PUSH', 'IN_APP'], event, title: 'Booking Confirmed', body: `A booking has been confirmed. Advance payment received.`, data: { bookingId: s(p.bookingId) } },
      ],
      'booking.completed': (p) => [
        { userId: s(p.customerId), channels: ['PUSH', 'IN_APP', 'SMS'] as const, event, title: 'Wedding Complete! 🎊', body: 'Your wedding event is complete. Please review your vendors!', data: { bookingId: s(p.bookingId) } },
        { userId: s(p.vendorId), channels: ['PUSH', 'IN_APP'] as const, event, title: 'Event Completed 🎊', body: 'The wedding event is marked complete. Escrow will be released shortly.', data: { bookingId: s(p.bookingId) } },
      ],
      'booking.cancelled': (p) => [{
        userId: s(p.actorRole) === 'customer' ? s(p.vendorId) : s(p.customerId),
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'Booking Cancelled',
        body: `A booking has been cancelled. ${s(p.reason)}`,
        data: { bookingId: s(p.bookingId) },
      }],

      // ── Payment events ────────────────────────────────────────────────────
      'payment.captured': (p) => [
        { userId: s(p.customerId), channels: ['PUSH', 'IN_APP'] as const, event, title: 'Payment Successful ✅', body: `₹${(n(p.amount) / 100).toLocaleString('en-IN')} paid securely via escrow.`, data: { bookingId: s(p.bookingId) } },
        { userId: s(p.vendorId), channels: ['PUSH', 'IN_APP'] as const, event, title: 'Payment Received', body: `Advance payment received for booking. Funds held in escrow.`, data: { bookingId: s(p.bookingId) } },
      ],
      'payment.failed': (p) => [{
        userId: s(p.customerId),
        channels: ['PUSH', 'IN_APP', 'SMS'] as const,
        event,
        title: 'Payment Failed ⚠️',
        body: 'Your payment could not be processed. Please try again.',
        data: { bookingId: s(p.bookingId) },
      }],
      'payment.refunded': (p) => [{
        userId: s(p.customerId),
        channels: ['PUSH', 'IN_APP', 'SMS'] as const,
        event,
        title: 'Refund Initiated 💸',
        body: `₹${(n(p.amount) / 100).toLocaleString('en-IN')} refund will be credited in 5-7 business days.`,
        data: { bookingId: s(p.bookingId) },
      }],
      'escrow.released': (p) => [
        { userId: s(p.vendorId), channels: ['PUSH', 'IN_APP', 'SMS'] as const, event, title: 'Payment Released! 🎉', body: `₹${(n(p.vendorPayout) / 100).toLocaleString('en-IN')} has been transferred to your account.`, data: { bookingId: s(p.bookingId) } },
        { userId: s(p.customerId), channels: ['PUSH', 'IN_APP'] as const, event, title: 'Escrow Released', body: 'Payment has been released to your vendor. Thank you!', data: { bookingId: s(p.bookingId) } },
      ],
      'payout.processed': (p) => [{
        userId: s(p.vendorId),
        channels: ['PUSH', 'IN_APP', 'SMS'] as const,
        event,
        title: 'Payout Processed 💰',
        body: `₹${(n(p.vendorPayoutPaise) / 100).toLocaleString('en-IN')} has been transferred to your bank account.`,
        data: {},
      }],

      // ── Review events ─────────────────────────────────────────────────────
      'review.created': (p) => [{
        userId: s(p.vendorId),
        channels: ['PUSH', 'IN_APP'] as const,
        event,
        title: 'New Review Posted ⭐',
        body: `${s(p.customerName) || 'A customer'} left you a ${s(p.rating)}-star review.`,
        data: { vendorId: s(p.vendorId), reviewId: s(p.reviewId) },
      }],

      // ── Execution / timeline events ───────────────────────────────────────
      'event.task_due_reminder': (p) => [{
        userId: s(p.customerId),
        channels: ['PUSH', 'IN_APP'] as const,
        event,
        title: `📋 Task Due: ${s(p.taskTitle)}`,
        body: `${n(p.daysLeft) === 0 ? 'Due today!' : `${n(p.daysLeft)}d left`} — ${s(p.taskTitle)}`,
        data: { timelineId: s(p.timelineId), taskId: s(p.taskId) },
      }],
      'event.vendor_check_in': (p) => [
        { userId: s(p.customerId), channels: ['PUSH', 'IN_APP'] as const, event, title: `${s(p.vendorName)} Checked In ✅`, body: `${s(p.vendorCategory)} vendor is on the premises.`, data: { bookingId: s(p.bookingId) } },
      ],
      'event.completed': (p) => [
        { userId: s(p.customerId), channels: ['PUSH', 'IN_APP', 'SMS'] as const, event, title: 'Wedding Complete! 🎊', body: 'Your wedding event is complete. Please review your vendors.', data: { bookingId: s(p.bookingId) } },
        { userId: s(p.vendorId), channels: ['PUSH', 'IN_APP'] as const, event, title: 'Event Completed', body: 'The wedding event is marked complete. Escrow will be released shortly.', data: { bookingId: s(p.bookingId) } },
      ],

      // ── Vendor KYC ────────────────────────────────────────────────────────
      'vendor.kyc_approved': (p) => [{
        userId: s(p.vendorId),
        channels: ['PUSH', 'IN_APP', 'SMS'] as const,
        event,
        title: 'KYC Approved ✅',
        body: 'Your vendor profile is now verified. You can start accepting bookings.',
        data: { vendorId: s(p.vendorId) },
      }],
      'vendor.kyc_rejected': (p) => [{
        userId: s(p.vendorId),
        channels: ['PUSH', 'IN_APP'] as const,
        event,
        title: 'KYC Rejected',
        body: `KYC verification failed: ${s(p.reason) || 'Please resubmit your documents.'}`,
        data: { vendorId: s(p.vendorId) },
      }],
    };

    const notifications = mapping[event]?.(eventPayload) ?? [];
    for (const n of notifications) {
      await this.enqueue(n);
    }
  },
};

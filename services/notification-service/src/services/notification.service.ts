import { prisma } from '../config/database';
import { notificationQueue, startNotificationWorker } from '../config/queue';
import { sendPushNotification } from '../utils/fcm';
import { sendSms, sendWhatsApp } from '../utils/sms';
import { logger } from '../utils/logger';

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
        } else if (channel === 'IN_APP') {
          // In-app is stored in DB as NotificationLog and fetched by frontend via polling or WS
          providerRef = log.id;
        }

        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'SENT', providerRef, sentAt: new Date() },
        });
      } catch (err: any) {
        logger.error({ err, channel, userId, event }, 'Notification delivery failed');
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: 'FAILED', errorMsg: err.message?.slice(0, 500) },
        });
      }
    }
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
  async handleEvent(event: string, eventPayload: any) {
    // Event routing — each event type maps to notification recipients
    const mapping: Record<string, (p: any) => NotifyPayload[]> = {
      'booking.enquiry_created': (p) => [{
        userId: p.vendorId,
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'New Booking Enquiry!',
        body: `You have a new booking enquiry. Please review and respond.`,
        data: { bookingId: p.bookingId },
      }],
      'booking.quote_sent': (p) => [{
        userId: p.customerId,
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'Quote Received',
        body: `Your vendor has sent a quote. Review it now.`,
        data: { bookingId: p.bookingId },
      }],
      'booking.confirmed': (p) => [
        { userId: p.customerId, channels: ['PUSH', 'SMS', 'IN_APP'], event, title: 'Booking Confirmed! 🎉', body: `Your wedding booking is confirmed. Check your timeline.`, data: { bookingId: p.bookingId } },
        { userId: p.vendorId, channels: ['PUSH', 'IN_APP'], event, title: 'Booking Confirmed', body: `A booking has been confirmed. Advance payment received.`, data: { bookingId: p.bookingId } },
      ],
      'booking.cancelled': (p) => [{
        userId: p.actorRole === 'customer' ? p.vendorId : p.customerId,
        channels: ['PUSH', 'IN_APP'],
        event,
        title: 'Booking Cancelled',
        body: `A booking has been cancelled. ${p.reason ?? ''}`,
        data: { bookingId: p.bookingId },
      }],
    };

    const notifications = mapping[event]?.(eventPayload) ?? [];
    for (const n of notifications) {
      await this.enqueue(n);
    }
  },
};

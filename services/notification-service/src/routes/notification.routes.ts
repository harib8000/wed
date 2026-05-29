import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { authenticate, requireInternalOrAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { prisma } from '../config/database';
import { sendEmail } from '../channels/email.channel';
import { config } from '../config';
import { logger } from '../utils/logger';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const GetNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().max(100).optional(),
});

export const InternalNotifySchema = z.object({
  event: z.string(),
  payload: z.object({}).passthrough(),
});

// ── Routes ──────────────────────────────────────────────────────────────────

export const notificationRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

// ── GET /notifications (my in-app notifications) ──────────────────────────────

notificationRouter.get('/', authenticate, validate(GetNotificationsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, type } = req.query as unknown as z.infer<typeof GetNotificationsQuerySchema>;
    const where = {
      userId: req.user!.id,
      channel: 'IN_APP' as const,
      status: { in: ['SENT', 'QUEUED'] as const },
      ...(type ? { event: type } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
      prisma.notificationLog.count({
        where: {
          userId: req.user!.id,
          channel: 'IN_APP',
          status: { in: ['SENT', 'QUEUED'] },
          readAt: null,
        },
      }),
    ]);

    res.json({ success: true, data: { notifications, total, page, limit, unreadCount }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── PATCH /notifications/:id/read
notificationRouter.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user!.id, req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Notification not found' }, meta: meta(req) });
    res.json({ success: true, data: { notification }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /notifications/read-all
notificationRouter.post('/read-all', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, data: { updatedCount: count }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /internal/notify (called by other services) ─────────────────────────

notificationRouter.post('/internal/notify', requireInternalOrAdmin, validate(InternalNotifySchema), async (req, res, next) => {
  try {
    const { event, payload } = req.body;
    await notificationService.handleEvent(event, payload);
    res.json({ status: 'queued' });
  } catch (err) { next(err); }
});

// ── POST /contact (public contact form → email to support) ───────────────────

const ContactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.enum(['general', 'vendor', 'payment', 'technical', 'other']).default('general'),
  message: z.string().min(10).max(5000),
});

notificationRouter.post('/contact', validate(ContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message } = req.body as z.infer<typeof ContactSchema>;
    const supportEmail = config.SUPPORT_EMAIL ?? 'support@weddingos.in';

    await sendEmail({
      to: supportEmail,
      subject: `[WeddingOS Contact] ${subject} — ${name}`,
      templateName: 'contact_form',
      templateVars: { name, email, phone: phone ?? 'N/A', subject, message },
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone ?? 'N/A'}\nSubject: ${subject}\n\n${message}`,
    });

    // Send auto-reply to user
    await sendEmail({
      to: email,
      subject: 'We received your message — WeddingOS Support',
      templateName: 'contact_autoreply',
      templateVars: { name },
      text: `Hi ${name},\n\nThank you for contacting WeddingOS. We have received your message and will get back to you within 24 hours.\n\nWarm regards,\nWeddingOS Support Team`,
    });

    logger.info({ name, email, subject }, 'Contact form submitted');
    res.json({ success: true, data: { message: 'Your message has been sent. We will get back to you shortly.' } });
  } catch (err) { next(err); }
});

notificationRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { authenticate, requireInternalOrAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { prisma } from '../config/database';

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

notificationRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

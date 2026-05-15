import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticate } from '../middleware/auth.middleware';

export const notificationRouter = Router();
const meta = (req: Request) => ({ requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() });

// ── GET /notifications (my in-app notifications) ──────────────────────────────

notificationRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { limit } = req.query as any;
    const notifications = await notificationService.getUnread(req.user!.id, parseInt(limit ?? '20'));
    res.json({ success: true, data: { notifications }, meta: meta(req) });
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

notificationRouter.post('/internal/notify', async (req, res, next) => {
  try {
    const { event, payload } = req.body;
    if (!event || !payload) return res.status(400).json({ error: 'event and payload required' });
    await notificationService.handleEvent(event, payload);
    res.json({ status: 'queued' });
  } catch (err) { next(err); }
});

notificationRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));

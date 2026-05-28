import { Router, Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { getPresignedUploadUrl } from '../utils/s3';
import { NotFoundError, ValidationError } from '@wedding-os/shared-errors';
import {
  UpdateProfileSchema,
  UpdateNotifPrefsSchema,
  RegisterPushTokenSchema,
  UploadKycSchema,
  CreateChecklistItemSchema,
  UpdateChecklistItemSchema,
  GenerateChecklistSchema,
} from '../types/user.types';
import { prisma } from '../config/database';

export const userRouter = Router();

function meta(req: Request) {
  return { requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const defaultChecklistTemplates = [
  { title: 'Book wedding venue', category: 'venue', monthsBefore: 6 },
  { title: 'Finalize catering', category: 'catering', monthsBefore: 4 },
  { title: 'Book photographer', category: 'photography', monthsBefore: 5 },
  { title: 'Book decorator', category: 'decor', monthsBefore: 3 },
  { title: 'Book makeup artist', category: 'makeup', monthsBefore: 2 },
  { title: 'Book DJ/Music', category: 'music', monthsBefore: 2 },
  { title: 'Send invitations', category: 'invitations', monthsBefore: 2 },
  { title: 'Finalize mehendi artist', category: 'mehendi', monthsBefore: 1 },
  { title: 'Confirm all vendor bookings', category: 'general', weeksBefore: 2 },
  { title: 'Final menu tasting', category: 'catering', monthsBefore: 1 },
  { title: 'Wedding dress fitting', category: 'attire', monthsBefore: 1 },
  { title: 'Arrange transportation', category: 'transport', monthsBefore: 1 },
  { title: 'Plan honeymoon', category: 'travel', monthsBefore: 3 },
  { title: 'Rehearsal dinner', category: 'general', weeksBefore: 1 },
  { title: 'Day-of emergency kit', category: 'general', weeksBefore: 1 },
] as const;

function parseWeddingDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new ValidationError('Invalid weddingDate', 'weddingDate');
  return date;
}

function shiftDate(baseDate: Date, monthsBefore?: number, weeksBefore?: number) {
  const date = new Date(baseDate);

  if (monthsBefore) {
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - monthsBefore);
    const lastDayOfTargetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  }

  if (weeksBefore) date.setUTCDate(date.getUTCDate() - (weeksBefore * 7));
  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysBeforeEvent(eventDate: Date, dueDate: Date) {
  return Math.max(0, Math.round((eventDate.getTime() - dueDate.getTime()) / DAY_IN_MS));
}

// ── GET /users/me ─────────────────────────────────────────────────────────────

userRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.getOrCreateProfile(req.user!.id);
    res.json({ success: true, data: { profile }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── PUT /users/me ──────────────────────────────────────────────────────────────

userRouter.put(
  '/me',
  authenticate,
  validate(UpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await profileService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: { profile }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── PUT /users/me/notifications ───────────────────────────────────────────────

userRouter.put(
  '/me/notifications',
  authenticate,
  validate(UpdateNotifPrefsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await profileService.updateNotifPrefs(req.user!.id, req.body);
      res.json({ success: true, data: { profile }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── POST /users/me/avatar/presign ─────────────────────────────────────────────

userRouter.post(
  '/me/avatar/presign',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contentType = 'image/jpeg' } = req.body;
      const ext = contentType.split('/')[1] || 'jpg';
      const result = await getPresignedUploadUrl(`avatars/${req.user!.id}`, contentType, ext);
      res.json({ success: true, data: result, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── POST /users/me/push-token ─────────────────────────────────────────────────

userRouter.post(
  '/me/push-token',
  authenticate,
  validate(RegisterPushTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, platform, deviceId } = req.body;
      await profileService.registerPushToken(req.user!.id, token, platform, deviceId);
      res.json({ success: true, data: { message: 'Push token registered' }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── DELETE /users/me/push-token ───────────────────────────────────────────────

userRouter.delete(
  '/me/push-token',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, error: { code: 'VAL_2001', message: 'token required' }, meta: meta(req) });
      await profileService.deactivatePushToken(token);
      res.json({ success: true, data: { message: 'Push token removed' }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── POST /users/me/kyc/presign ────────────────────────────────────────────────

userRouter.post(
  '/me/kyc/presign',
  authenticate,
  validate(UploadKycSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { docType, contentType } = req.body;
      const ext = contentType.includes('pdf') ? 'pdf' : contentType.split('/')[1];
      const result = await getPresignedUploadUrl(`kyc/${req.user!.id}/${docType}`, contentType, ext);

      // Record in DB
      const kycDoc = await profileService.initiateKycUpload(req.user!.id, docType, result.s3Key);

      res.status(201).json({
        success: true,
        data: { ...result, kycDocumentId: kycDoc.id },
        meta: meta(req),
      });
    } catch (err) { next(err); }
  }
);

// ── GET /users/:userId (admin or internal) ────────────────────────────────────

userRouter.get(
  '/:userId',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await profileService.getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'User not found' }, meta: meta(req) });
      res.json({ success: true, data: { profile }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── PATCH /users/kyc/:docId/review (admin) ─────────────────────────────────────

userRouter.patch(
  '/kyc/:docId/review',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, note } = req.body;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, error: { code: 'VAL_2001', message: 'status must be APPROVED or REJECTED' }, meta: meta(req) });
      }
      const doc = await profileService.reviewKyc(req.params.docId, status, req.user!.id, note);
      res.json({ success: true, data: { doc }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

userRouter.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }));

// ── GET /users/me/checklist ────────────────────────────────────────────────────

userRouter.get('/me/checklist', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.checklistItem.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ daysBeforeEvent: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: { items }, meta: meta(req) });
  } catch (err) { next(err); }
});

// ── POST /users/me/checklist ───────────────────────────────────────────────────

userRouter.post(
  '/me/checklist',
  authenticate,
  validate(CreateChecklistItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, detail, category, daysBeforeEvent, isDone } = req.body;
      const item = await prisma.checklistItem.create({
        data: {
          userId: req.user!.id,
          title,
          detail,
          category: category ?? 'other',
          daysBeforeEvent,
          isDone: isDone ?? false,
        },
      });
      res.status(201).json({ success: true, data: { item }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── POST /users/me/checklist/generate ──────────────────────────────────────────

userRouter.post(
  '/me/checklist/generate',
  authenticate,
  validate(GenerateChecklistSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingDate } = req.body as { weddingDate: string };
      const eventDate = parseWeddingDate(weddingDate);
      const existingItems = await prisma.checklistItem.findMany({
        where: { userId: req.user!.id },
        select: { title: true },
      });
      const existingTitles = new Set(existingItems.map((item) => item.title));

      const tasksToCreate = defaultChecklistTemplates
        .filter((template) => !existingTitles.has(template.title))
        .map((template) => {
          const dueDate = shiftDate(eventDate, template.monthsBefore, template.weeksBefore);
          return {
            title: template.title,
            category: template.category,
            dueDate: formatDate(dueDate),
            daysBeforeEvent: getDaysBeforeEvent(eventDate, dueDate),
          };
        });

      const items = tasksToCreate.length === 0
        ? []
        : await prisma.$transaction(
          tasksToCreate.map((task) => prisma.checklistItem.create({
            data: {
              userId: req.user!.id,
              title: task.title,
              category: task.category,
              detail: `Suggested due date: ${task.dueDate}`,
              daysBeforeEvent: task.daysBeforeEvent,
              isDone: false,
            },
          }))
        );

      res.status(201).json({
        success: true,
        data: {
          items: items.map((item, index) => ({ ...item, dueDate: tasksToCreate[index].dueDate })),
          totalGenerated: items.length,
        },
        meta: meta(req),
      });
    } catch (err) { next(err); }
  }
);

// ── PATCH /users/me/checklist/:id ─────────────────────────────────────────────

userRouter.patch(
  '/me/checklist/:id',
  authenticate,
  validate(UpdateChecklistItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the item belongs to the authenticated user
      const existing = await prisma.checklistItem.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
      });
      if (!existing) throw new NotFoundError('ChecklistItem', req.params.id);
      const item = await prisma.checklistItem.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: { item }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

// ── DELETE /users/me/checklist/:id ────────────────────────────────────────────

userRouter.delete(
  '/me/checklist/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.checklistItem.findFirst({
        where: { id: req.params.id, userId: req.user!.id },
      });
      if (!existing) throw new NotFoundError('ChecklistItem', req.params.id);
      await prisma.checklistItem.delete({ where: { id: req.params.id } });
      res.json({ success: true, data: { message: 'Deleted' }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

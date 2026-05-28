import { Router, Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { getPresignedUploadUrl } from '../utils/s3';
import {
  UpdateProfileSchema,
  UpdateNotifPrefsSchema,
  RegisterPushTokenSchema,
  UploadKycSchema,
  CreateChecklistItemSchema,
  UpdateChecklistItemSchema,
} from '../types/user.types';
import { prisma } from '../config/database';

export const userRouter = Router();

function meta(req: Request) {
  return { requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() };
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
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'RES_3001', message: 'Checklist item not found' },
          meta: meta(req),
        });
      }
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
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'RES_3001', message: 'Checklist item not found' },
          meta: meta(req),
        });
      }
      await prisma.checklistItem.delete({ where: { id: req.params.id } });
      res.json({ success: true, data: { message: 'Deleted' }, meta: meta(req) });
    } catch (err) { next(err); }
  }
);

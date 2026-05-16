import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { z } from 'zod';
import { uploadService, MediaType } from '../services/upload.service';
import { config } from '../config';
import { validate } from '../middleware/validate';
import { UnauthorizedError, AppError } from '@wedding-os/shared-errors';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const PresignSchema = z.object({
  mediaType: z.enum(['avatar', 'portfolio', 'kyc', 'review', 'vendor_cover', 'chat']),
  mimeType: z.string(),
  fileName: z.string().min(1).max(255),
});

export const DeleteMediaSchema = z.object({
  key: z.string().min(1),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const router = Router();

let cachedKey: string | null = null;
function getPublicKey(): string {
  if (!cachedKey) {
    if (config.JWT_PUBLIC_KEY_PATH) {
      try { cachedKey = fs.readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf-8'); } catch {}
    }
    if (!cachedKey && config.JWT_PUBLIC_KEY) cachedKey = config.JWT_PUBLIC_KEY;
    if (!cachedKey) throw new AppError('SYS_9001', 'JWT public key not configured', 500);
  }
  return cachedKey;
}

function getUser(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError('No token provided');
  const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as { sub?: string; id?: string; role: string };
  return { id: payload.sub || payload.id || '', role: payload.role };
}

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /media/presign — get presigned upload URL
router.post('/presign', validate(PresignSchema), (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { mediaType, mimeType, fileName } = req.body;
    uploadService.getPresignedUploadUrl(user.id, mediaType, mimeType, fileName)
      .then((data) => res.json({ success: true, data }))
      .catch((err: unknown) => {
        const status = err instanceof AppError ? err.statusCode : 500;
        const message = err instanceof Error ? err.message : 'Upload failed';
        res.status(status).json({ success: false, error: { message } });
      });
  } catch (err: unknown) {
    const status = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Unauthorized';
    res.status(status).json({ success: false, error: { message } });
  }
});

// DELETE /media — delete a media file by key
router.delete('/', validate(DeleteMediaSchema), (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { key } = req.body;
    // Security: only allow deleting own files
    if (!key.includes(user.id) && user.role !== 'admin') {
      res.status(403).json({ success: false, error: { message: 'Forbidden' } }); return;
    }
    uploadService.deleteMedia(key)
      .then(() => res.json({ success: true }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Delete failed';
        res.status(500).json({ success: false, error: { message } });
      });
  } catch (err: unknown) {
    const status = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Unauthorized';
    res.status(status).json({ success: false, error: { message } });
  }
});

export { router as mediaRouter };

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { z } from 'zod';
import { uploadService, MediaType } from '../services/upload.service';
import { config } from '../config';
import { validate } from '../middleware/validate';

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
    if (!cachedKey) throw new Error('JWT public key not configured');
  }
  return cachedKey;
}

function getUser(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
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
      .catch((err) => res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } }));
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ success: false, error: { message: err.message } });
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
      .catch((err) => res.status(500).json({ success: false, error: { message: err.message } }));
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ success: false, error: { message: err.message } });
  }
});

export { router as mediaRouter };

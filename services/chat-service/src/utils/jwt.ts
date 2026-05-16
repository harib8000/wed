import jwt from 'jsonwebtoken';
import fs from 'fs';
import { config } from '../config';
import { AppError } from '@wedding-os/shared-errors';

interface JwtPayload {
  sub?: string;
  id?: string;
  role: string;
  phone: string;
  iat?: number;
  exp?: number;
}

let cachedKey: string | null = null;

export function verifyToken(token: string): { id: string; role: string; phone: string } {
  if (!cachedKey) {
    if (config.JWT_PUBLIC_KEY_PATH) {
      try { cachedKey = fs.readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf-8'); } catch {}
    }
    if (!cachedKey && config.JWT_PUBLIC_KEY) cachedKey = config.JWT_PUBLIC_KEY;
    if (!cachedKey) throw new AppError('SYS_9001', 'JWT public key not configured', 500);
  }
  const payload = jwt.verify(token, cachedKey, { algorithms: ['RS256'] }) as JwtPayload;
  return { id: payload.sub || payload.id, role: payload.role, phone: payload.phone };
}

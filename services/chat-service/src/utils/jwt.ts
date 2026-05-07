import jwt from 'jsonwebtoken';
import fs from 'fs';
import { config } from '../config';

let cachedKey: string | null = null;

export function verifyToken(token: string): { id: string; role: string; phone: string } {
  if (!cachedKey) {
    if (config.JWT_PUBLIC_KEY_PATH) {
      try { cachedKey = fs.readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf-8'); } catch {}
    }
    if (!cachedKey && config.JWT_PUBLIC_KEY) cachedKey = config.JWT_PUBLIC_KEY;
    if (!cachedKey) throw new Error('JWT public key not configured');
  }
  const payload = jwt.verify(token, cachedKey, { algorithms: ['RS256'] }) as any;
  return { id: payload.sub || payload.id, role: payload.role, phone: payload.phone };
}

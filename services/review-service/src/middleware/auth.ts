import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; phone: string };
}

function loadPublicKey(): string {
  if (config.JWT_PUBLIC_KEY_PATH) {
    try { return fs.readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf-8'); } catch {}
  }
  if (config.JWT_PUBLIC_KEY) return config.JWT_PUBLIC_KEY;
  throw new Error('JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH must be configured');
}

let cachedKey: string | null = null;

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'AUTH_1001', message: 'No token provided' } });
    return;
  }
  const token = header.slice(7);
  try {
    if (!cachedKey) cachedKey = loadPublicKey();
    const payload = jwt.verify(token, cachedKey, { algorithms: ['RS256'] }) as any;
    req.user = { id: payload.sub || payload.id, role: payload.role, phone: payload.phone };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_1001', message: 'Invalid or expired token' } });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: { code: 'AUTH_1003', message: 'Forbidden' } });
      return;
    }
    next();
  };
}

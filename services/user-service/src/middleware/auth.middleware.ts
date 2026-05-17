import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

interface JwtPayload {
  sub?: string;
  userId?: string;
  role: string;
  phone: string;
  iat?: number;
  exp?: number;
}

// ── Resolve public key ────────────────────────────────────────────────────────

function getPublicKey(): string {
  if (config.JWT_PUBLIC_KEY) return config.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
  if (config.JWT_PUBLIC_KEY_PATH) return readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf8');
  // Dev fallback: accept HS256 symmetric with hardcoded secret
  return 'dev-secret-do-not-use-in-production';
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string; phone: string };
    }
  }
}

class AuthError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AuthError(401, 'AUTH_1007', 'Authentication required'));
  }

  const token = authHeader.slice(7);
  try {
    const publicKey = getPublicKey();
    const algorithms = config.JWT_PUBLIC_KEY || config.JWT_PUBLIC_KEY_PATH
      ? (['RS256'] as jwt.Algorithm[])
      : (['HS256'] as jwt.Algorithm[]);

    const payload = jwt.verify(token, publicKey, { algorithms }) as JwtPayload;
    req.user = { id: payload.sub ?? payload.userId, role: payload.role, phone: payload.phone };
    next();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      next(new AuthError(401, 'AUTH_1005', 'Token expired'));
    } else {
      next(new AuthError(401, 'AUTH_1006', 'Invalid token'));
    }
  }
};

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AuthError(401, 'AUTH_1007', 'Authentication required'));
    if (!roles.includes(req.user.role))
      return next(new AuthError(403, 'AUTH_1008', `Requires role: ${roles.join(' or ')}`));
    next();
  };

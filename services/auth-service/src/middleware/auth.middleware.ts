import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { userService } from '../services/user.service';
import { UnauthorizedError, ForbiddenError, TokenExpiredError, TokenInvalidError } from '../types/errors';
import { logger } from '../utils/logger';

// Re-export common error classes for this service
export { UnauthorizedError, ForbiddenError };

class UnauthorizedErrorLocal extends Error {
  statusCode = 401;
  code = 'AUTH_1007';
  constructor(msg = 'Authentication required') { super(msg); }
}

class ForbiddenErrorLocal extends Error {
  statusCode = 403;
  code = 'AUTH_1008';
  constructor(msg = 'Forbidden') { super(msg); }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        phone: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedErrorLocal();
    }

    const token = authHeader.slice(7);

    // Check Redis blacklist
    const blacklisted = await userService.isTokenBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedErrorLocal('Token has been revoked');
    }

    // Verify JWT
    const payload = jwtService.verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      phone: payload.phone,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      next(new TokenExpiredError());
    } else if (err instanceof Error && err.name === 'JsonWebTokenError') {
      next(new TokenInvalidError());
    } else {
      next(err);
    }
  }
};

export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedErrorLocal());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenErrorLocal(`Required role: ${roles.join(' or ')}`));
    }
    next();
  };

// Placeholder imports (these error classes exist in shared-errors package)
class TokenExpiredError extends Error { statusCode = 401; code = 'AUTH_1005'; }
class TokenInvalidError extends Error { statusCode = 401; code = 'AUTH_1006'; }

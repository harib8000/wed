import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const status = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  res.status(status).json({
    success: false,
    error: { code, message: err.message || 'Internal server error' },
    meta: { requestId: (req as any).requestId, timestamp: new Date().toISOString() },
  });
}

export function requestId(req: any, res: Response, next: NextFunction): void {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@wedding-os/shared-errors';
import crypto from 'crypto';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;
  const timestamp = new Date().toISOString();

  // AppError from shared-errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.field && { field: err.field }), ...(err.details && { details: err.details }) },
      meta: { requestId, timestamp },
    });
    return;
  }

  // Legacy error objects with statusCode/code properties
  if (err && typeof err === 'object' && 'statusCode' in err && 'code' in err) {
    const appErr = err as { statusCode: number; code: string; message: string; field?: string };
    const status = appErr.statusCode || 500;
    res.status(status).json({
      success: false,
      error: { code: appErr.code, message: appErr.message, ...(appErr.field && { field: appErr.field }) },
      meta: { requestId, timestamp },
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    error: { code: 'SYS_9001', message: 'An internal error occurred. Please try again.' },
    meta: { requestId, timestamp },
  });
}

export function requestIdMiddleware(req: Request & { requestId?: string }, res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

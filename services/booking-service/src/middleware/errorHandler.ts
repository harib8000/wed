import { Request, Response, NextFunction } from 'express';
import { AppError } from '@wedding-os/shared-errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  const timestamp = new Date().toISOString();

  // AppError from shared-errors
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path, method: req.method }, 'Operational error');
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
    logger.warn({ err: appErr, path: req.path, method: req.method }, 'Operational error');
    res.status(appErr.statusCode).json({
      success: false,
      error: { code: appErr.code, message: appErr.message, ...(appErr.field && { field: appErr.field }) },
      meta: { requestId, timestamp },
    });
    return;
  }

  // Unknown errors
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'SYS_9001', message: 'An internal error occurred. Please try again.' },
    meta: { requestId, timestamp },
  });
};

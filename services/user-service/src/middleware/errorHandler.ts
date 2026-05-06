import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'SYS_9001';
  const message = statusCode < 500 ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.headers['x-request-id'] }, 'Unhandled server error');
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(err.field && { field: err.field }) },
    meta: {
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    },
  });
};

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@wedding-os/shared-errors';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, field: err.field, details: err.details },
      meta: { requestId, timestamp },
    });
    return;
  }

  if (err && typeof err === 'object' && 'statusCode' in err && 'code' in err) {
    const appErr = err as { statusCode: number; code: string; message: string; field?: string };
    res.status(appErr.statusCode).json({
      success: false,
      error: { code: appErr.code, message: appErr.message, field: appErr.field },
      meta: { requestId, timestamp },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: { code: 'SYS_9001', message: 'An internal error occurred. Please try again.' },
    meta: { requestId, timestamp },
  });
};

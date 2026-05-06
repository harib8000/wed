import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { logger } from '../utils/logger';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstField = Object.keys(errors)[0];
      const firstMessage = errors[firstField]?.[0] ?? 'Validation failed';

      logger.debug({ errors, path: req.path }, 'Validation failed');

      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_2001',
          message: firstMessage,
          field: firstField,
          details: errors,
        },
        meta: {
          requestId: req.headers['x-request-id'] as string,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    req[source] = result.data;
    next();
  };

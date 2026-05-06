import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_2001', message: 'Validation failed', details },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    }
    req[target] = result.data;
    next();
  };

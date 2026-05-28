import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { userRouter } from './routes/user.routes';
import { adminRouter } from './routes/admin.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use(pinoHttp({ logger, customLogLevel: (_req, res, err) => err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info' }));

  app.use('/users/admin', adminRouter);
  app.use('/users', userRouter);
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service', ts: new Date() }));

  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);
  return app;
}

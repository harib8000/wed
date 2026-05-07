import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { reviewRouter } from './routes/review.routes';
import { errorHandler, requestId } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';

export function createApp(): Application {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','X-Request-ID'] }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));

  app.get('/reviews/health', (_, res) => res.json({ status: 'ok', service: 'review-service', timestamp: new Date().toISOString() }));
  app.use('/reviews', reviewRouter);

  app.use(errorHandler);
  return app;
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { vendorRouter } from './routes/vendor.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { ensureVendorIndex } from './config/elasticsearch';

export async function createApp() {
  await ensureVendorIndex().catch((err) => logger.warn(err, 'Could not ensure ES index (ES may not be ready)'));

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 400, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));

  app.use('/vendors', vendorRouter);
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'vendor-service' }));
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);
  return app;
}

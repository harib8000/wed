import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { paymentRouter } from './routes/payment.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { startEscrowWorker } from './config/queue';
import { paymentService } from './services/payment.service';

export function createApp() {
  // Start BullMQ worker for scheduled escrow releases
  startEscrowWorker(async (job) => {
    const { escrowHoldId } = job.data;
    logger.info({ escrowHoldId }, 'Processing scheduled escrow release');
    await paymentService.releaseEscrow(escrowHoldId);
  });

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

  // Note: /payments/webhook uses raw body — must be before express.json()
  // The route itself applies express.raw() middleware
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10kb' }));

  app.use(requestId);
  app.use(pinoHttp({ logger }));
  app.use('/payments', paymentRouter);
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);
  return app;
}

import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { notificationRouter } from './routes/notification.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { notificationService } from './services/notification.service';
import { createEventBus } from '@wedding-os/shared-events';
import * as Sentry from '@sentry/node';
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();


if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
}


async function bootstrap() {
  await connectDatabase();

  // Start BullMQ worker
  const worker = notificationService.startWorker();
  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Notification job failed'));

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '50kb' }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));
  app.use('/notifications', notificationRouter);
  app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(String(err));
  }
});

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);

  // ── Event Bus — subscribe to domain events for auto-notifications ─────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'notification-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  await eventBus.subscribeMany([
    {
      type: 'booking.enquiry_created',
      handler: async (event) => {
        await notificationService.handleEvent('booking.enquiry_created', event.payload);
      },
    },
    {
      type: 'booking.confirmed',
      handler: async (event) => {
        await notificationService.handleEvent('booking.confirmed', event.payload);
      },
    },
    {
      type: 'payment.captured',
      handler: async (event) => {
        await notificationService.handleEvent('payment.captured', event.payload);
      },
    },
    {
      type: 'escrow.released',
      handler: async (event) => {
        await notificationService.handleEvent('escrow.released', event.payload);
      },
    },
    {
      type: 'review.created',
      handler: async (event) => {
        await notificationService.handleEvent('review.created', event.payload);
      },
    },
    {
      type: 'vendor.kyc_approved',
      handler: async (event) => {
        await notificationService.handleEvent('vendor.kyc_approved', event.payload);
      },
    },
    {
      type: 'vendor.kyc_rejected',
      handler: async (event) => {
        await notificationService.handleEvent('vendor.kyc_rejected', event.payload);
      },
    },
  ]);
  logger.info('Subscribed to domain events');

  const server = http.createServer(app);
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Notification service listening'));

  const shutdown = async () => {
    await worker.close();
    await eventBus.disconnect();
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => { console.error(err); process.exit(1); });

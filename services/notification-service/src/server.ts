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
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Notification service listening'));

  const shutdown = async () => {
    await worker.close();
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => { console.error(err); process.exit(1); });

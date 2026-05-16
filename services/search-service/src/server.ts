import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { searchRouter } from './routes/search.routes';
import { connectElasticsearch } from './config/elasticsearch';
import { searchService } from './services/search.service';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { createEventBus } from '@wedding-os/shared-events';

async function bootstrap() {
  await connectElasticsearch();

  // ── Event Bus — reactive vendor indexing ──────────────────────────────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'search-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  // Re-index vendor in ES when vendor data changes
  await eventBus.subscribe('vendor.registered', async (event) => {
    const payload = event.payload as any;
    logger.info({ vendorId: payload.vendorId }, 'Indexing new vendor');
    await searchService.indexVendor(payload);
  });
  await eventBus.subscribe('vendor.profile_updated', async (event) => {
    const payload = event.payload as any;
    logger.info({ vendorId: payload.vendorId }, 'Re-indexing updated vendor');
    await searchService.indexVendor(payload);
  });
  await eventBus.subscribe('vendor.kyc_approved', async (event) => {
    const payload = event.payload as any;
    logger.info({ vendorId: payload.vendorId }, 'Indexing approved vendor');
    await searchService.indexVendor(payload);
  });
  await eventBus.subscribe('vendor.kyc_rejected', async (event) => {
    const payload = event.payload as any;
    logger.info({ vendorId: payload.vendorId }, 'Removing suspended vendor from index');
    await searchService.deleteVendor(payload.vendorId);
  });

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(pinoHttp({ logger }));

  app.get('/search/health', (_, res) => res.json({ status: 'ok', service: 'search-service', timestamp: new Date().toISOString() }));
  app.use('/search', searchRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Search service listening');
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    server.close(async () => {
      await eventBus.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 30_000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
  process.on('uncaughtException', (err) => { logger.fatal(err, 'Uncaught exception'); process.exit(1); });
}

bootstrap().catch((err) => { console.error('Failed to start:', err); process.exit(1); });

import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { config } from './config';
import { createEventBus } from '@wedding-os/shared-events';

async function bootstrap() {
  await connectDatabase();

  // ── Event Bus ─────────────────────────────────────────────────────────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'vendor-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  // Subscribe to review events to update vendor rating stats
  await eventBus.subscribe('review.created', async (event) => {
    const { vendorId, rating } = event.payload as any;
    logger.info({ vendorId, rating }, 'Received review.created — will recalc rating via vendor service');
  });

  const app = await createApp();
  const server = http.createServer(app);
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Vendor service listening'));

  const shutdown = async () => {
    server.close(async () => {
      await eventBus.disconnect();
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => { console.error(err); process.exit(1); });

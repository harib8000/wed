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
    serviceName: 'payment-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  // Subscribe to booking events
  await eventBus.subscribe('booking.confirmed', async (event) => {
    logger.info({ bookingId: event.aggregateId }, 'Received booking.confirmed — creating escrow order');
  });

  const server = http.createServer(createApp());
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Payment service listening'));

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

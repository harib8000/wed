import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { config } from './config';
import { createEventBus } from '@wedding-os/shared-events';
import * as Sentry from '@sentry/node';

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
}


async function bootstrap() {
  await connectDatabase();

  // ── Event Bus ─────────────────────────────────────────────────────────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'user-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  const server = http.createServer(createApp());
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'User service listening'));

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

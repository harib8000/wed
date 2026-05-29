import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
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


const PORT = config.PORT;

async function bootstrap() {
  // Connect to Postgres & Redis
  await connectDatabase();
  getRedisClient(); // initialise connection eagerly

  // ── Event Bus ─────────────────────────────────────────────────────────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'auth-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  const app = createApp();
  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info({ port: PORT, env: config.NODE_ENV }, 'Auth service listening');
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received, draining connections…');

    server.close(async () => {
      try {
        await eventBus.disconnect();
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Cleanup complete, exiting.');
        process.exit(0);
      } catch (err) {
        logger.error(err, 'Error during cleanup');
        process.exit(1);
      }
    });

    // Force kill after 30 s
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 30_000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal(err, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { config } from './config';

async function bootstrap() {
  await connectDatabase();
  const server = http.createServer(createApp());
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'User service listening'));

  const shutdown = async () => {
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => { console.error(err); process.exit(1); });

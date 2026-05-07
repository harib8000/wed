import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { mediaRouter } from './routes/media.routes';
import { logger } from './utils/logger';
import { config } from './config';

async function bootstrap() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/media/health', (_, res) => res.json({ status: 'ok', service: 'media-service', timestamp: new Date().toISOString() }));
  app.use('/media', mediaRouter);

  const server = http.createServer(app);
  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Media service listening');
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 30_000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
  process.on('uncaughtException', (err) => { logger.fatal(err, 'Uncaught exception'); process.exit(1); });
}

bootstrap().catch((err) => { console.error('Failed to start:', err); process.exit(1); });

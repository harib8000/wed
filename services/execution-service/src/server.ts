import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { executionRouter } from './routes/execution.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap() {
  await connectDatabase();

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));
  app.use('/execution', executionRouter);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'RES_3001', message: 'Not found' } }));
  app.use(errorHandler);

  const server = http.createServer(app);

  // ── Socket.IO for real-time task updates ───────────────────────────────────
  const io = new SocketIO(server, {
    cors: { origin: config.ALLOWED_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('join:timeline', (customerId: string) => {
      socket.join(`timeline:${customerId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Execution service listening'));

  const shutdown = async () => {
    io.close();
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => { console.error(err); process.exit(1); });

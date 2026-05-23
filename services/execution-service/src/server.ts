import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { executionRouter } from './routes/execution.routes';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { runDailyReminderJob } from './jobs/reminder.job';
import { createEventBus } from '@wedding-os/shared-events';

// Simple cron scheduler (no external deps) — runs at 08:00 IST daily
function scheduleDaily(fn: () => void): NodeJS.Timeout {
  const msUntilNextRun = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(2, 30, 0, 0); // 08:00 IST = 02:30 UTC
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  };
  const scheduleNext = () => setTimeout(() => { fn(); scheduleNext(); }, msUntilNextRun());
  return scheduleNext();
}

async function bootstrap() {
  await connectDatabase();

  // ── Event Bus ─────────────────────────────────────────────────────────────
  const eventBus = createEventBus({
    redisUrl: config.REDIS_URL,
    serviceName: 'execution-service',
  });
  await eventBus.connect();
  logger.info('Event bus connected');

  // Subscribe to booking events for automatic timeline creation
  await eventBus.subscribe('booking.confirmed', async (event) => {
    const payload = event.payload as Record<string, unknown>;
    const bookingId = payload?.bookingId as string | undefined;
    const customerId = payload?.customerId as string | undefined;
    const vendorId = payload?.vendorId as string | undefined;
    if (!bookingId) { logger.warn({ payload }, 'booking.confirmed missing bookingId'); return; }
    logger.info({ bookingId, customerId, vendorId }, 'Received booking.confirmed — ready for timeline creation');
  });

  await eventBus.subscribe('booking.completed', async (event) => {
    const payload = event.payload as Record<string, unknown>;
    const bookingId = payload?.bookingId as string | undefined;
    if (!bookingId) { logger.warn({ payload }, 'booking.completed missing bookingId'); return; }
    logger.info({ bookingId }, 'Received booking.completed');
  });

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
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

  // Schedule daily reminder job (08:00 IST)
  scheduleDaily(() => runDailyReminderJob().catch(err => logger.error(err, 'Reminder job failed')));
  logger.info('Daily reminder scheduler started');

  const shutdown = async () => {
    io.close();
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

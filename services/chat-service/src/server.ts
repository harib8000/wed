import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { connectMongo, disconnectMongo, Message, Conversation } from './config/database';
import { registerChatHandlers } from './handlers/chat.handler';
import { verifyToken } from './utils/jwt';
import { logger } from './utils/logger';
import { config } from './config';

async function bootstrap() {
  await connectMongo();
  logger.info('MongoDB connected');

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(pinoHttp({ logger }));

  // Health check
  app.get('/chat/health', (_, res) => res.json({ status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() }));

  // REST: Get conversation history
  app.get('/chat/conversations/:bookingId/messages', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ success: false, error: { code: 'AUTH_1001', message: 'Unauthorized' } }); return; }
    try {
      const user = verifyToken(token);
      const { bookingId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 50;

      const conv = await Conversation.findOne({ bookingId });
      if (!conv || (conv.customerId !== user.id && conv.vendorId !== user.id)) {
        res.status(404).json({ success: false, error: { message: 'Not found' } }); return;
      }
      const messages = await Message.find({ conversationId: bookingId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({ success: true, data: { messages: messages.reverse(), page, hasMore: messages.length === limit } });
    } catch { res.status(401).json({ success: false, error: { message: 'Invalid token' } }); }
  });

  // REST: Create or get conversation by bookingId
  app.post('/chat/conversations', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ success: false, error: { message: 'Unauthorized' } }); return; }
    try {
      const user = verifyToken(token);
      const { bookingId, customerId, vendorId } = req.body;
      if (!bookingId || !customerId || !vendorId) {
        res.status(400).json({ success: false, error: { message: 'bookingId, customerId, vendorId required' } }); return;
      }
      let conv = await Conversation.findOne({ bookingId });
      if (!conv) {
        conv = await Conversation.create({ bookingId, customerId, vendorId });
      }
      res.json({ success: true, data: { conversation: conv } });
    } catch (err: any) {
      res.status(err.status || 500).json({ success: false, error: { message: err.message } });
    }
  });

  // REST: Get user conversations list
  app.get('/chat/conversations', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ success: false, error: { message: 'Unauthorized' } }); return; }
    try {
      const user = verifyToken(token);
      const isVendor = user.role === 'vendor';
      const filter = isVendor ? { vendorId: user.id } : { customerId: user.id };
      const conversations = await Conversation.find(filter).sort({ lastMessageAt: -1 }).limit(50).lean();
      res.json({ success: true, data: { conversations } });
    } catch { res.status(401).json({ success: false, error: { message: 'Invalid token' } }); }
  });

  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: { origin: config.ALLOWED_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
  });

  registerChatHandlers(io);

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Chat service listening');
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    server.close(async () => {
      await disconnectMongo();
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

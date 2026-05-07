import { Server as SocketServer, Socket } from 'socket.io';
import { Message, Conversation } from '../config/database';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthSocket extends Socket {
  user?: { id: string; role: string; phone: string };
}

export function registerChatHandlers(io: SocketServer): void {
  // Auth middleware for Socket.IO
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const user = socket.user!;
    logger.info({ userId: user.id, socketId: socket.id }, 'User connected to chat');

    // Join personal rooms
    socket.join(`user:${user.id}`);

    // Join a conversation room
    socket.on('join:conversation', async (bookingId: string) => {
      try {
        const conv = await Conversation.findOne({ bookingId });
        if (!conv) { socket.emit('error', { message: 'Conversation not found' }); return; }
        if (conv.customerId !== user.id && conv.vendorId !== user.id) {
          socket.emit('error', { message: 'Access denied' }); return;
        }
        socket.join(`conversation:${bookingId}`);
        socket.emit('joined', { bookingId });

        // Reset unread count
        const update = user.id === conv.customerId
          ? { customerUnread: 0 }
          : { vendorUnread: 0 };
        await Conversation.findByIdAndUpdate(conv._id, update);
      } catch (err) {
        logger.error(err, 'join:conversation error');
        socket.emit('error', { message: 'Server error' });
      }
    });

    // Send message
    socket.on('message:send', async (data: { bookingId: string; content: string; contentType?: string }) => {
      try {
        if (!data.bookingId || !data.content?.trim()) { socket.emit('error', { message: 'Invalid message' }); return; }
        if (data.content.length > 2000) { socket.emit('error', { message: 'Message too long' }); return; }

        let conv = await Conversation.findOne({ bookingId: data.bookingId });
        if (!conv) { socket.emit('error', { message: 'Conversation not found' }); return; }
        if (conv.customerId !== user.id && conv.vendorId !== user.id) {
          socket.emit('error', { message: 'Access denied' }); return;
        }

        const msg = await Message.create({
          conversationId: data.bookingId,
          senderId: user.id,
          senderRole: user.role,
          content: data.content.trim(),
          contentType: data.contentType || 'text',
        });

        // Update conversation
        const isCustomer = user.id === conv.customerId;
        await Conversation.findByIdAndUpdate(conv._id, {
          lastMessage: data.content.substring(0, 100),
          lastMessageAt: new Date(),
          ...(isCustomer ? { vendorUnread: conv.vendorUnread + 1 } : { customerUnread: conv.customerUnread + 1 }),
        });

        // Broadcast to room
        io.to(`conversation:${data.bookingId}`).emit('message:new', {
          id: msg._id, conversationId: data.bookingId, senderId: user.id,
          senderRole: user.role, content: msg.content, contentType: msg.contentType,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        logger.error(err, 'message:send error');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (bookingId: string) => {
      socket.to(`conversation:${bookingId}`).emit('typing:start', { userId: user.id });
    });
    socket.on('typing:stop', (bookingId: string) => {
      socket.to(`conversation:${bookingId}`).emit('typing:stop', { userId: user.id });
    });

    socket.on('disconnect', () => {
      logger.info({ userId: user.id }, 'User disconnected from chat');
    });
  });
}

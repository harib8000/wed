// ── Mocks (must be before imports) ───────────────────────────────────────────

jest.mock('../../src/config', () => ({
  config: {
    NODE_ENV: 'test',
    PORT: 4010,
    MONGODB_URL: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_PUBLIC_KEY: 'test-key',
    ALLOWED_ORIGINS: ['http://localhost:3000'],
  },
}));

const mockConversationFindOne = jest.fn();
const mockConversationFindByIdAndUpdate = jest.fn();
const mockMessageCreate = jest.fn();

jest.mock('../../src/config/database', () => ({
  Message: { create: mockMessageCreate },
  Conversation: {
    findOne: mockConversationFindOne,
    findByIdAndUpdate: mockConversationFindByIdAndUpdate,
  },
}));

jest.mock('../../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { registerChatHandlers } from '../../src/handlers/chat.handler';
import { verifyToken } from '../../src/utils/jwt';
import { logger } from '../../src/utils/logger';

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

// ── Socket.IO mock helpers ───────────────────────────────────────────────────

type EventHandler = (...args: unknown[]) => void | Promise<void>;

function createMockSocket(overrides: Record<string, unknown> = {}) {
  const eventHandlers: Record<string, EventHandler> = {};
  const rooms = new Set<string>();

  const socket: Record<string, unknown> = {
    id: 'socket-1',
    handshake: { auth: {}, headers: {} },
    user: undefined,
    join: jest.fn((room: string) => rooms.add(room)),
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
    on: jest.fn((event: string, handler: EventHandler) => {
      eventHandlers[event] = handler;
    }),
    rooms,
    ...overrides,
  };

  return {
    socket,
    eventHandlers,
    trigger: async (event: string, ...args: unknown[]) => {
      if (eventHandlers[event]) await eventHandlers[event](...args);
    },
  };
}

type MiddlewareFn = (socket: Record<string, unknown>, next: (err?: Error) => void) => void;

function createMockIO() {
  const middlewares: MiddlewareFn[] = [];
  let connectionHandler: ((socket: Record<string, unknown>) => void) | null = null;
  const broadcastEmit = jest.fn();

  const io: Record<string, unknown> = {
    use: jest.fn((fn: MiddlewareFn) => middlewares.push(fn)),
    on: jest.fn((event: string, handler: (socket: Record<string, unknown>) => void) => {
      if (event === 'connection') connectionHandler = handler;
    }),
    to: jest.fn(() => ({ emit: broadcastEmit })),
  };

  return {
    io,
    middlewares,
    broadcastEmit,
    simulateConnection: (socket: Record<string, unknown>) => {
      connectionHandler?.(socket);
    },
    runMiddleware: (socket: Record<string, unknown>): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (middlewares.length === 0) return resolve();
        let idx = 0;
        const next = (err?: Error) => {
          if (err) return reject(err);
          idx++;
          if (idx < middlewares.length) {
            middlewares[idx](socket, next);
          } else {
            resolve();
          }
        };
        middlewares[0](socket, next);
      });
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeConversation(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'conv-1',
    bookingId: 'booking-1',
    customerId: 'customer-1',
    vendorId: 'vendor-1',
    lastMessage: null,
    lastMessageAt: null,
    customerUnread: 0,
    vendorUnread: 3,
    isActive: true,
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return { id: 'customer-1', role: 'customer', phone: '+919876543210', ...overrides };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('registerChatHandlers', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Auth Middleware ──────────────────────────────────────────────────────

  describe('auth middleware', () => {
    it('should reject connection with missing token', async () => {
      const { io, runMiddleware } = createMockIO();
      registerChatHandlers(io as never);

      const { socket } = createMockSocket();
      socket.handshake = { auth: {}, headers: {} };

      await expect(runMiddleware(socket)).rejects.toThrow('Authentication required');
    });

    it('should reject connection with invalid token', async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const { io, runMiddleware } = createMockIO();
      registerChatHandlers(io as never);

      const { socket } = createMockSocket();
      socket.handshake = { auth: { token: 'bad-token' }, headers: {} };

      await expect(runMiddleware(socket)).rejects.toThrow('Invalid token');
    });

    it('should accept connection with valid token and set user', async () => {
      const user = makeUser();
      mockVerifyToken.mockReturnValue(user);

      const { io, runMiddleware } = createMockIO();
      registerChatHandlers(io as never);

      const { socket } = createMockSocket();
      socket.handshake = { auth: { token: 'valid-jwt' }, headers: {} };

      await runMiddleware(socket);

      expect(socket.user).toEqual(user);
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt');
    });

    it('should extract token from Authorization header', async () => {
      const user = makeUser();
      mockVerifyToken.mockReturnValue(user);

      const { io, runMiddleware } = createMockIO();
      registerChatHandlers(io as never);

      const { socket } = createMockSocket();
      socket.handshake = { auth: {}, headers: { authorization: 'Bearer header-token' } };

      await runMiddleware(socket);

      expect(mockVerifyToken).toHaveBeenCalledWith('header-token');
      expect(socket.user).toEqual(user);
    });
  });

  // ── connection event ────────────────────────────────────────────────────

  describe('connection', () => {
    function setupConnectedSocket(userOverrides: Record<string, unknown> = {}) {
      const user = makeUser(userOverrides);
      const mockIO = createMockIO();
      registerChatHandlers(mockIO.io as never);

      const mockSocket = createMockSocket({ user });
      mockIO.simulateConnection(mockSocket.socket);
      return { ...mockIO, ...mockSocket, user };
    }

    it('should join personal room and log connection', () => {
      const { socket, user } = setupConnectedSocket();

      expect(socket.join).toHaveBeenCalledWith(`user:${user.id}`);
      expect(logger.info).toHaveBeenCalledWith(
        { userId: user.id, socketId: 'socket-1' },
        'User connected to chat',
      );
    });

    // ── join:conversation ─────────────────────────────────────────────────

    describe('join:conversation', () => {
      it('should join room on valid conversation', async () => {
        const conv = makeConversation();
        mockConversationFindOne.mockResolvedValue(conv);
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { socket, trigger } = setupConnectedSocket();
        await trigger('join:conversation', 'booking-1');

        expect(socket.join).toHaveBeenCalledWith('conversation:booking-1');
        expect(socket.emit).toHaveBeenCalledWith('joined', { bookingId: 'booking-1' });
      });

      it('should emit error when conversation not found', async () => {
        mockConversationFindOne.mockResolvedValue(null);

        const { socket, trigger } = setupConnectedSocket();
        await trigger('join:conversation', 'nonexistent');

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Conversation not found' });
      });

      it('should deny access to unauthorized user', async () => {
        const conv = makeConversation({ customerId: 'other-user', vendorId: 'other-vendor' });
        mockConversationFindOne.mockResolvedValue(conv);

        const { socket, trigger } = setupConnectedSocket();
        await trigger('join:conversation', 'booking-1');

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Access denied' });
      });

      it('should reset customerUnread when customer joins', async () => {
        const conv = makeConversation({ customerUnread: 5 });
        mockConversationFindOne.mockResolvedValue(conv);
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { trigger } = setupConnectedSocket({ id: 'customer-1' });
        await trigger('join:conversation', 'booking-1');

        expect(mockConversationFindByIdAndUpdate).toHaveBeenCalledWith('conv-1', {
          customerUnread: 0,
        });
      });

      it('should reset vendorUnread when vendor joins', async () => {
        const conv = makeConversation({ vendorUnread: 8 });
        mockConversationFindOne.mockResolvedValue(conv);
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { trigger } = setupConnectedSocket({ id: 'vendor-1', role: 'vendor' });
        await trigger('join:conversation', 'booking-1');

        expect(mockConversationFindByIdAndUpdate).toHaveBeenCalledWith('conv-1', {
          vendorUnread: 0,
        });
      });
    });

    // ── message:send ──────────────────────────────────────────────────────

    describe('message:send', () => {
      it('should reject empty content', async () => {
        const { socket, trigger } = setupConnectedSocket();
        await trigger('message:send', { bookingId: 'booking-1', content: '' });

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Invalid message' });
        expect(mockMessageCreate).not.toHaveBeenCalled();
      });

      it('should reject missing bookingId', async () => {
        const { socket, trigger } = setupConnectedSocket();
        await trigger('message:send', { bookingId: '', content: 'hello' });

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Invalid message' });
      });

      it('should reject content exceeding 2000 characters', async () => {
        const { socket, trigger } = setupConnectedSocket();
        const longContent = 'a'.repeat(2001);
        await trigger('message:send', { bookingId: 'booking-1', content: longContent });

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Message too long' });
        expect(mockMessageCreate).not.toHaveBeenCalled();
      });

      it('should reject when user not part of conversation', async () => {
        const conv = makeConversation({ customerId: 'other', vendorId: 'other-vendor' });
        mockConversationFindOne.mockResolvedValue(conv);

        const { socket, trigger } = setupConnectedSocket();
        await trigger('message:send', { bookingId: 'booking-1', content: 'hello' });

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Access denied' });
        expect(mockMessageCreate).not.toHaveBeenCalled();
      });

      it('should create message and broadcast to room', async () => {
        const conv = makeConversation({ vendorUnread: 2 });
        const now = new Date();
        const createdMsg = {
          _id: 'msg-1',
          conversationId: 'booking-1',
          senderId: 'customer-1',
          senderRole: 'customer',
          content: 'Hello vendor!',
          contentType: 'text',
          createdAt: now,
        };

        mockConversationFindOne.mockResolvedValue(conv);
        mockMessageCreate.mockResolvedValue(createdMsg);
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { trigger, broadcastEmit } = setupConnectedSocket();
        await trigger('message:send', { bookingId: 'booking-1', content: 'Hello vendor!' });

        expect(mockMessageCreate).toHaveBeenCalledWith({
          conversationId: 'booking-1',
          senderId: 'customer-1',
          senderRole: 'customer',
          content: 'Hello vendor!',
          contentType: 'text',
        });

        // Conversation updated with incremented vendorUnread (customer sent → vendor unread++)
        expect(mockConversationFindByIdAndUpdate).toHaveBeenCalledWith(
          'conv-1',
          expect.objectContaining({
            lastMessage: 'Hello vendor!',
            vendorUnread: 3,
          }),
        );

        expect(broadcastEmit).toHaveBeenCalledWith('message:new', {
          id: 'msg-1',
          conversationId: 'booking-1',
          senderId: 'customer-1',
          senderRole: 'customer',
          content: 'Hello vendor!',
          contentType: 'text',
          createdAt: now,
        });
      });

      it('should increment customerUnread when vendor sends message', async () => {
        const conv = makeConversation({ customerUnread: 1 });
        const createdMsg = {
          _id: 'msg-2',
          content: 'Hi there',
          contentType: 'text',
          createdAt: new Date(),
        };

        mockConversationFindOne.mockResolvedValue(conv);
        mockMessageCreate.mockResolvedValue(createdMsg);
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { trigger } = setupConnectedSocket({ id: 'vendor-1', role: 'vendor' });
        await trigger('message:send', { bookingId: 'booking-1', content: 'Hi there' });

        expect(mockConversationFindByIdAndUpdate).toHaveBeenCalledWith(
          'conv-1',
          expect.objectContaining({ customerUnread: 2 }),
        );
      });

      it('should default contentType to text', async () => {
        const conv = makeConversation();
        mockConversationFindOne.mockResolvedValue(conv);
        mockMessageCreate.mockResolvedValue({ _id: 'msg-3', content: 'hi', contentType: 'text', createdAt: new Date() });
        mockConversationFindByIdAndUpdate.mockResolvedValue(conv);

        const { trigger } = setupConnectedSocket();
        await trigger('message:send', { bookingId: 'booking-1', content: 'hi' });

        expect(mockMessageCreate).toHaveBeenCalledWith(
          expect.objectContaining({ contentType: 'text' }),
        );
      });

      it('should emit error on database failure', async () => {
        mockConversationFindOne.mockRejectedValue(new Error('DB connection failed'));

        const { socket, trigger } = setupConnectedSocket();
        await trigger('message:send', { bookingId: 'booking-1', content: 'hello' });

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to send message' });
        expect(logger.error).toHaveBeenCalled();
      });
    });

    // ── typing indicators ─────────────────────────────────────────────────

    describe('typing:start', () => {
      it('should broadcast typing event to conversation room', async () => {
        const toEmit = jest.fn();
        const { socket, trigger } = setupConnectedSocket();
        (socket.to as jest.Mock).mockReturnValue({ emit: toEmit });

        await trigger('typing:start', 'booking-1');

        expect(socket.to).toHaveBeenCalledWith('conversation:booking-1');
        expect(toEmit).toHaveBeenCalledWith('typing:start', { userId: 'customer-1' });
      });
    });

    describe('typing:stop', () => {
      it('should broadcast typing stop event', async () => {
        const toEmit = jest.fn();
        const { socket, trigger } = setupConnectedSocket();
        (socket.to as jest.Mock).mockReturnValue({ emit: toEmit });

        await trigger('typing:stop', 'booking-1');

        expect(socket.to).toHaveBeenCalledWith('conversation:booking-1');
        expect(toEmit).toHaveBeenCalledWith('typing:stop', { userId: 'customer-1' });
      });
    });

    // ── disconnect ────────────────────────────────────────────────────────

    describe('disconnect', () => {
      it('should log user disconnection', async () => {
        const { trigger } = setupConnectedSocket();
        await trigger('disconnect');

        expect(logger.info).toHaveBeenCalledWith(
          { userId: 'customer-1' },
          'User disconnected from chat',
        );
      });
    });
  });
});

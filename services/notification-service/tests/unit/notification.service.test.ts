/* ------------------------------------------------------------------ */
/*  notification.service – unit tests                                 */
/* ------------------------------------------------------------------ */

// ── Mocks must be declared before imports ────────────────────────────
jest.mock('../../src/config/database', () => ({
  prisma: {
    notificationLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/config/queue', () => ({
  notificationQueue: { add: jest.fn() },
  startNotificationWorker: jest.fn(),
}));

jest.mock('../../src/utils/fcm', () => ({
  sendPushNotification: jest.fn(),
}));

jest.mock('../../src/utils/sms', () => ({
  sendSms: jest.fn(),
  sendWhatsApp: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Imports ──────────────────────────────────────────────────────────
import { notificationService, NotifyPayload } from '../../src/services/notification.service';
import { prisma } from '../../src/config/database';
import { notificationQueue } from '../../src/config/queue';
import { sendPushNotification } from '../../src/utils/fcm';
import { sendSms, sendWhatsApp } from '../../src/utils/sms';
import { logger } from '../../src/utils/logger';

// ── Typed helpers ────────────────────────────────────────────────────
const mockPrisma = prisma.notificationLog as {
  create: jest.Mock;
  findFirst: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  findMany: jest.Mock;
};
const mockQueue = notificationQueue as { add: jest.Mock };
const mockFcm = sendPushNotification as jest.Mock;
const mockSms = sendSms as jest.Mock;
const mockWhatsApp = sendWhatsApp as jest.Mock;
const mockLogger = logger as { error: jest.Mock };

beforeEach(() => jest.clearAllMocks());

// ── Helpers ──────────────────────────────────────────────────────────
function basePayload(overrides: Partial<NotifyPayload> = {}): NotifyPayload {
  return {
    userId: 'user-1',
    channels: ['IN_APP'],
    event: 'test.event',
    title: 'Test Title',
    body: 'Test body',
    ...overrides,
  };
}

function fakeLog(id = 'log-1') {
  return { id, userId: 'user-1', channel: 'IN_APP', event: 'test', title: 'T', body: 'B', data: {}, status: 'QUEUED' };
}

// ═════════════════════════════════════════════════════════════════════
//  enqueue
// ═════════════════════════════════════════════════════════════════════
describe('enqueue', () => {
  it('adds job to BullMQ queue', async () => {
    const payload = basePayload();
    await notificationService.enqueue(payload);

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith('send', payload);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  send
// ═════════════════════════════════════════════════════════════════════
describe('send', () => {
  it('sends PUSH notification via FCM', async () => {
    const log = fakeLog();
    mockPrisma.create.mockResolvedValue(log);
    mockFcm.mockResolvedValue('fcm-msg-123');
    mockPrisma.update.mockResolvedValue({ ...log, status: 'SENT' });

    await notificationService.send(
      basePayload({ channels: ['PUSH'], pushTokens: ['tok-a'] }),
    );

    expect(mockFcm).toHaveBeenCalledWith('tok-a', 'Test Title', 'Test body', undefined);
    expect(mockPrisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: log.id },
        data: expect.objectContaining({ status: 'SENT', providerRef: 'fcm-msg-123' }),
      }),
    );
  });

  it('sends SMS via MSG91', async () => {
    const log = fakeLog();
    mockPrisma.create.mockResolvedValue(log);
    mockSms.mockResolvedValue('sms-req-456');
    mockPrisma.update.mockResolvedValue({ ...log, status: 'SENT' });

    await notificationService.send(
      basePayload({ channels: ['SMS'], phone: '+919876543210' }),
    );

    expect(mockSms).toHaveBeenCalledWith('+919876543210', 'Test body');
    expect(mockPrisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SENT', providerRef: 'sms-req-456' }),
      }),
    );
  });

  it('sends IN_APP and creates DB record with log id as providerRef', async () => {
    const log = fakeLog('inapp-99');
    mockPrisma.create.mockResolvedValue(log);
    mockPrisma.update.mockResolvedValue({ ...log, status: 'SENT' });

    await notificationService.send(basePayload({ channels: ['IN_APP'] }));

    expect(mockPrisma.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SENT', providerRef: 'inapp-99' }),
      }),
    );
  });

  it('handles PUSH failure gracefully (logs error, does not throw)', async () => {
    const log = fakeLog();
    mockPrisma.create.mockResolvedValue(log);
    mockFcm.mockRejectedValue(new Error('FCM token invalid'));
    mockPrisma.update.mockResolvedValue({ ...log, status: 'FAILED' });

    // Should not throw
    await notificationService.send(
      basePayload({ channels: ['PUSH'], pushTokens: ['bad-tok'] }),
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'PUSH', userId: 'user-1' }),
      'Notification delivery failed',
    );
    expect(mockPrisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', errorMsg: 'FCM token invalid' }),
      }),
    );
  });

  it('sends to multiple channels in one call', async () => {
    mockPrisma.create
      .mockResolvedValueOnce(fakeLog('log-push'))
      .mockResolvedValueOnce(fakeLog('log-inapp'));
    mockFcm.mockResolvedValue('fcm-id');
    mockPrisma.update.mockResolvedValue({});

    await notificationService.send(
      basePayload({ channels: ['PUSH', 'IN_APP'], pushTokens: ['tok-x'] }),
    );

    expect(mockPrisma.create).toHaveBeenCalledTimes(2);
    expect(mockFcm).toHaveBeenCalledTimes(1);
    expect(mockPrisma.update).toHaveBeenCalledTimes(2);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  markAsRead
// ═════════════════════════════════════════════════════════════════════
describe('markAsRead', () => {
  it('updates notification with readAt timestamp', async () => {
    const existing = fakeLog('n-1');
    mockPrisma.findFirst.mockResolvedValue(existing);
    const updated = { ...existing, readAt: new Date() };
    mockPrisma.update.mockResolvedValue(updated);

    const result = await notificationService.markAsRead('user-1', 'n-1');

    expect(mockPrisma.findFirst).toHaveBeenCalledWith({
      where: { id: 'n-1', userId: 'user-1', channel: 'IN_APP' },
    });
    expect(mockPrisma.update).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { readAt: expect.any(Date) },
    });
    expect(result).toEqual(updated);
  });

  it('returns null when userId does not match', async () => {
    mockPrisma.findFirst.mockResolvedValue(null);

    const result = await notificationService.markAsRead('wrong-user', 'n-1');

    expect(result).toBeNull();
    expect(mockPrisma.update).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  markAllAsRead
// ═════════════════════════════════════════════════════════════════════
describe('markAllAsRead', () => {
  it('updates all unread IN_APP notifications for user and returns count', async () => {
    mockPrisma.updateMany.mockResolvedValue({ count: 5 });

    const count = await notificationService.markAllAsRead('user-1');

    expect(count).toBe(5);
    expect(mockPrisma.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', channel: 'IN_APP', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  getUnread
// ═════════════════════════════════════════════════════════════════════
describe('getUnread', () => {
  const rows = [fakeLog('a'), fakeLog('b')];

  it('returns unread notifications with default limit of 20', async () => {
    mockPrisma.findMany.mockResolvedValue(rows);

    const result = await notificationService.getUnread('user-1');

    expect(result).toEqual(rows);
    expect(mockPrisma.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', channel: 'IN_APP', status: { in: ['SENT', 'QUEUED'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  });

  it('respects custom limit parameter', async () => {
    mockPrisma.findMany.mockResolvedValue(rows);

    await notificationService.getUnread('user-1', 5);

    expect(mockPrisma.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════
//  handleEvent
// ═════════════════════════════════════════════════════════════════════
describe('handleEvent', () => {
  it('booking.enquiry_created enqueues notification to vendor', async () => {
    mockQueue.add.mockResolvedValue({});

    await notificationService.handleEvent('booking.enquiry_created', {
      vendorId: 'vendor-42',
      bookingId: 'bk-1',
    });

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        userId: 'vendor-42',
        channels: ['PUSH', 'IN_APP'],
        event: 'booking.enquiry_created',
        title: expect.stringContaining('Enquiry'),
        data: { bookingId: 'bk-1' },
      }),
    );
  });

  it('payment.captured enqueues notifications to both customer and vendor', async () => {
    mockQueue.add.mockResolvedValue({});

    await notificationService.handleEvent('payment.captured', {
      customerId: 'cust-1',
      vendorId: 'vendor-2',
      amount: 5000000, // 50,000 INR in paise
      bookingId: 'bk-7',
    });

    expect(mockQueue.add).toHaveBeenCalledTimes(2);

    // Customer notification
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        userId: 'cust-1',
        title: expect.stringContaining('Payment Successful'),
      }),
    );

    // Vendor notification
    expect(mockQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({
        userId: 'vendor-2',
        title: expect.stringContaining('Payment Received'),
      }),
    );
  });

  it('unknown event is ignored gracefully (no enqueue)', async () => {
    await notificationService.handleEvent('some.unknown.event', { foo: 'bar' });

    expect(mockQueue.add).not.toHaveBeenCalled();
  });
});

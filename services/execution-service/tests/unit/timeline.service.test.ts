// ── Mocks (must be before imports of the module under test) ──────────────────

jest.mock('../../src/config/database', () => ({
  prisma: {
    weddingTimeline: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    timelineTask: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/config/database';
import { timelineService } from '../../src/services/timeline.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTimeline(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tl-1',
    customerId: 'cust-1',
    weddingDate: new Date('2025-12-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
    ...overrides,
  };
}

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    timelineId: 'tl-1',
    title: 'Book photographer',
    category: 'PHOTOGRAPHY',
    status: 'PENDING',
    sortOrder: 1,
    isSystemGenerated: false,
    dueDate: new Date('2025-06-01'),
    completedAt: null,
    description: null,
    linkedBookingId: null,
    assignedVendorId: null,
    dueDaysBeforeWedding: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('timelineService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getOrCreate ──────────────────────────────────────────────────────────

  describe('getOrCreate', () => {
    it('should return existing timeline if one exists', async () => {
      const existing = makeTimeline({ tasks: [makeTask()] });
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(existing);

      const result = await timelineService.getOrCreate('cust-1');

      expect(result).toEqual(existing);
      expect(mockPrisma.weddingTimeline.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        include: { tasks: { orderBy: { sortOrder: 'asc' } } },
      });
      expect(mockPrisma.weddingTimeline.create).not.toHaveBeenCalled();
    });

    it('should create new timeline with 12 default tasks when none exists', async () => {
      const weddingDate = new Date('2025-12-20');
      const created = makeTimeline({
        weddingDate,
        tasks: Array.from({ length: 12 }, (_, i) =>
          makeTask({ id: `task-${i + 1}`, sortOrder: i + 1, isSystemGenerated: true }),
        ),
      });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.weddingTimeline.create as jest.Mock).mockResolvedValue(created);

      const result = await timelineService.getOrCreate('cust-1', weddingDate);

      expect(result).toEqual(created);
      expect(result!.tasks).toHaveLength(12);
      expect(mockPrisma.weddingTimeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'cust-1',
            weddingDate,
            tasks: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  title: 'Set your wedding date & budget',
                  category: 'OTHER',
                  isSystemGenerated: true,
                  sortOrder: 1,
                }),
                expect.objectContaining({
                  title: 'Wedding day vendor check-ins',
                  category: 'LOGISTICS',
                  isSystemGenerated: true,
                  sortOrder: 12,
                }),
              ]),
            }),
          }),
          include: { tasks: { orderBy: { sortOrder: 'asc' } } },
        }),
      );
    });

    it('should calculate task due dates relative to wedding date', async () => {
      const weddingDate = new Date('2026-01-15');
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.weddingTimeline.create as jest.Mock).mockResolvedValue(makeTimeline({ weddingDate }));

      await timelineService.getOrCreate('cust-1', weddingDate);

      const createCall = (mockPrisma.weddingTimeline.create as jest.Mock).mock.calls[0][0];
      const tasks = createCall.data.tasks.create as Array<{ dueDate: Date; dueDaysBeforeWedding: number }>;

      // First task: 365 days before wedding
      const firstTask = tasks.find((t) => t.dueDaysBeforeWedding === 365);
      expect(firstTask).toBeDefined();
      const expectedDate = new Date(weddingDate.getTime() - 365 * 86400_000);
      expect(firstTask!.dueDate.getTime()).toBe(expectedDate.getTime());

      // Last task: 0 days before wedding (wedding day itself)
      const lastTask = tasks.find((t) => t.dueDaysBeforeWedding === 0);
      expect(lastTask).toBeDefined();
      expect(lastTask!.dueDate.getTime()).toBe(weddingDate.getTime());
    });

    it('should return null when no timeline exists and no weddingDate provided', async () => {
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await timelineService.getOrCreate('cust-1');

      expect(result).toBeNull();
      expect(mockPrisma.weddingTimeline.create).not.toHaveBeenCalled();
    });
  });

  // ── addTask ────────────────────────────────────────────────────────────────

  describe('addTask', () => {
    it('should add a task to an existing timeline', async () => {
      const timeline = makeTimeline();
      const newTask = makeTask({ id: 'task-new', title: 'Hire DJ' });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.create as jest.Mock).mockResolvedValue(newTask);

      const result = await timelineService.addTask('cust-1', {
        title: 'Hire DJ',
        category: 'ENTERTAINMENT',
        dueDate: '2025-06-15',
      });

      expect(result).toEqual(newTask);
      expect(mockPrisma.timelineTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timelineId: 'tl-1',
          title: 'Hire DJ',
          category: 'ENTERTAINMENT',
          dueDate: new Date('2025-06-15'),
        }),
      });
    });

    it('should throw 404 if no timeline exists', async () => {
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        timelineService.addTask('cust-1', { title: 'Hire DJ' }),
      ).rejects.toMatchObject({ message: 'Timeline not found', statusCode: 404 });
    });

    it('should default category to OTHER when not provided', async () => {
      const timeline = makeTimeline();
      const newTask = makeTask({ category: 'OTHER' });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.create as jest.Mock).mockResolvedValue(newTask);

      await timelineService.addTask('cust-1', { title: 'Something custom' });

      expect(mockPrisma.timelineTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ category: 'OTHER' }),
      });
    });
  });

  // ── updateTask ─────────────────────────────────────────────────────────────

  describe('updateTask', () => {
    it('should update task status', async () => {
      const timeline = makeTimeline();
      const task = makeTask();
      const updated = makeTask({ status: 'IN_PROGRESS' });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.findFirst as jest.Mock).mockResolvedValue(task);
      (mockPrisma.timelineTask.update as jest.Mock).mockResolvedValue(updated);

      const result = await timelineService.updateTask('cust-1', 'task-1', { status: 'IN_PROGRESS' });

      expect(result).toEqual(updated);
      expect(mockPrisma.timelineTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({ status: 'IN_PROGRESS' }),
      });
    });

    it('should set completedAt when status is DONE', async () => {
      const timeline = makeTimeline();
      const task = makeTask();
      const now = new Date();
      jest.useFakeTimers({ now });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.findFirst as jest.Mock).mockResolvedValue(task);
      (mockPrisma.timelineTask.update as jest.Mock).mockResolvedValue(
        makeTask({ status: 'DONE', completedAt: now }),
      );

      await timelineService.updateTask('cust-1', 'task-1', { status: 'DONE' });

      expect(mockPrisma.timelineTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          status: 'DONE',
          completedAt: expect.any(Date),
        }),
      });

      jest.useRealTimers();
    });

    it('should throw 404 if timeline not found', async () => {
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        timelineService.updateTask('cust-1', 'task-1', { status: 'DONE' }),
      ).rejects.toMatchObject({ message: 'Timeline not found', statusCode: 404 });
    });

    it('should throw 404 if task not found in timeline', async () => {
      const timeline = makeTimeline();
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        timelineService.updateTask('cust-1', 'missing-task', { status: 'DONE' }),
      ).rejects.toMatchObject({ message: 'Task not found', statusCode: 404 });
    });
  });

  // ── deleteTask ─────────────────────────────────────────────────────────────

  describe('deleteTask', () => {
    it('should delete a non-system task', async () => {
      const timeline = makeTimeline();
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await timelineService.deleteTask('cust-1', 'task-1');

      expect(result).toEqual({ count: 1 });
      expect(mockPrisma.timelineTask.deleteMany).toHaveBeenCalledWith({
        where: { id: 'task-1', timelineId: 'tl-1', isSystemGenerated: false },
      });
    });

    it('should not delete system-generated tasks (returns count 0)', async () => {
      const timeline = makeTimeline();
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);
      (mockPrisma.timelineTask.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await timelineService.deleteTask('cust-1', 'system-task-1');

      expect(result).toEqual({ count: 0 });
      expect(mockPrisma.timelineTask.deleteMany).toHaveBeenCalledWith({
        where: { id: 'system-task-1', timelineId: 'tl-1', isSystemGenerated: false },
      });
    });

    it('should throw 404 if timeline not found', async () => {
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        timelineService.deleteTask('cust-1', 'task-1'),
      ).rejects.toMatchObject({ message: 'Timeline not found', statusCode: 404 });
    });
  });

  // ── getTimeline ────────────────────────────────────────────────────────────

  describe('getTimeline', () => {
    it('should return timeline with tasks sorted by sortOrder and dueDate', async () => {
      const tasks = [
        makeTask({ id: 'task-1', sortOrder: 1, dueDate: new Date('2025-03-01') }),
        makeTask({ id: 'task-2', sortOrder: 2, dueDate: new Date('2025-06-01') }),
        makeTask({ id: 'task-3', sortOrder: 3, dueDate: new Date('2025-09-01') }),
      ];
      const timeline = makeTimeline({ tasks });

      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(timeline);

      const result = await timelineService.getTimeline('cust-1');

      expect(result).toEqual(timeline);
      expect(result!.tasks).toHaveLength(3);
      expect(mockPrisma.weddingTimeline.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'cust-1' },
        include: { tasks: { orderBy: [{ sortOrder: 'asc' }, { dueDate: 'asc' }] } },
      });
    });

    it('should return null if no timeline exists', async () => {
      (mockPrisma.weddingTimeline.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await timelineService.getTimeline('cust-1');

      expect(result).toBeNull();
    });
  });
});

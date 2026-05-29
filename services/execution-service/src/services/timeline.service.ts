import { prisma } from '../config/database';
import type { TaskCategory, TaskStatus } from '@prisma/client';
import { NotFoundError } from '@wedding-os/shared-errors';
import { getEventBus, type DomainEventType } from '@wedding-os/shared-events';
import { logger } from '../utils/logger';

// Default template tasks generated when a wedding is confirmed
const DEFAULT_TEMPLATES = [
  { title: 'Set your wedding date & budget', category: 'OTHER', dueDaysBeforeWedding: 365, sortOrder: 1 },
  { title: 'Choose and book wedding venue', category: 'VENUE', dueDaysBeforeWedding: 300, sortOrder: 2 },
  { title: 'Book a wedding planner', category: 'VENDOR_BOOKING', dueDaysBeforeWedding: 270, sortOrder: 3 },
  { title: 'Book photographer & videographer', category: 'PHOTOGRAPHY', dueDaysBeforeWedding: 240, sortOrder: 4 },
  { title: 'Select & finalize catering vendor', category: 'CATERING', dueDaysBeforeWedding: 210, sortOrder: 5 },
  { title: 'Book DJ/band for entertainment', category: 'ENTERTAINMENT', dueDaysBeforeWedding: 180, sortOrder: 6 },
  { title: 'Bridal makeup trial & booking', category: 'VENDOR_BOOKING', dueDaysBeforeWedding: 150, sortOrder: 7 },
  { title: 'Send out wedding invitations', category: 'GUEST_MANAGEMENT', dueDaysBeforeWedding: 90, sortOrder: 8 },
  { title: 'Finalize décor & floral arrangement', category: 'DECORATION', dueDaysBeforeWedding: 60, sortOrder: 9 },
  { title: 'Confirm guest count with caterer', category: 'CATERING', dueDaysBeforeWedding: 30, sortOrder: 10 },
  { title: 'Final dress rehearsal & all vendor confirmations', category: 'CEREMONY', dueDaysBeforeWedding: 7, sortOrder: 11 },
  { title: 'Wedding day vendor check-ins', category: 'LOGISTICS', dueDaysBeforeWedding: 0, sortOrder: 12 },
];

function publishEvent(type: DomainEventType, aggregateId: string, payload: Record<string, unknown>) {
  try {
    const bus = getEventBus();
    bus.publish(type, aggregateId, 'execution', payload).catch((err: unknown) =>
      logger.warn({ err, type }, 'Event publish failed (non-blocking)')
    );
  } catch { /* Event bus not initialized (e.g., in tests) */ }
}

export const timelineService = {
  async getOrCreate(customerId: string, weddingDate?: Date) {
    let timeline = await prisma.weddingTimeline.findUnique({
      where: { customerId },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!timeline && weddingDate) {
      timeline = await prisma.weddingTimeline.create({
        data: {
          customerId,
          weddingDate,
          tasks: {
            create: DEFAULT_TEMPLATES.map((t) => ({
              title: t.title,
              category: t.category as TaskCategory,
              dueDaysBeforeWedding: t.dueDaysBeforeWedding,
              sortOrder: t.sortOrder,
              isSystemGenerated: true,
              dueDate: new Date(weddingDate.getTime() - t.dueDaysBeforeWedding * 86400_000),
            })),
          },
        },
        include: { tasks: { orderBy: { sortOrder: 'asc' } } },
      });
      publishEvent('event.created', timeline.id, {
        timelineId: timeline.id,
        customerId,
        weddingDate: timeline.weddingDate.toISOString(),
      });
    }

    return timeline;
  },

  async addTask(customerId: string, data: {
    title: string;
    category?: string;
    description?: string;
    dueDate?: string;
    linkedBookingId?: string;
    assignedVendorId?: string;
  }) {
    let tl = await prisma.weddingTimeline.findUnique({ where: { customerId } });
    if (!tl) throw new NotFoundError('Timeline');

    return prisma.timelineTask.create({
      data: {
        timelineId: tl.id,
        title: data.title,
        category: (data.category as TaskCategory) ?? 'OTHER',
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        linkedBookingId: data.linkedBookingId,
        assignedVendorId: data.assignedVendorId,
      },
    });
  },

  async updateTask(customerId: string, taskId: string, data: {
    status?: string;
    title?: string;
    dueDate?: string;
    description?: string;
  }) {
    const tl = await prisma.weddingTimeline.findUnique({ where: { customerId } });
    if (!tl) throw new NotFoundError('Timeline');

    const task = await prisma.timelineTask.findFirst({ where: { id: taskId, timelineId: tl.id } });
    if (!task) throw new NotFoundError('Task', taskId);

    const updatedTask = await prisma.timelineTask.update({
      where: { id: taskId },
      data: {
        ...(data.status && { status: data.status as TaskStatus, completedAt: data.status === 'DONE' ? new Date() : undefined }),
        ...(data.title && { title: data.title }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    if (data.status === 'DONE') {
      publishEvent('event.task_completed', updatedTask.id, {
        taskId: updatedTask.id,
        timelineId: tl.id,
        customerId,
        title: updatedTask.title,
        category: updatedTask.category,
        linkedBookingId: updatedTask.linkedBookingId ?? null,
      });

      const remainingTasks = await prisma.timelineTask.count({
        where: { timelineId: tl.id, status: { not: 'DONE' } },
      });

      if (remainingTasks === 0) {
        publishEvent('event.completed', tl.id, {
          timelineId: tl.id,
          customerId,
          weddingDate: tl.weddingDate.toISOString(),
        });
      }
    }

    return updatedTask;
  },

  async deleteTask(customerId: string, taskId: string) {
    const tl = await prisma.weddingTimeline.findUnique({ where: { customerId } });
    if (!tl) throw new NotFoundError('Timeline');
    return prisma.timelineTask.deleteMany({ where: { id: taskId, timelineId: tl.id, isSystemGenerated: false } });
  },

  async getTimeline(customerId: string) {
    return prisma.weddingTimeline.findUnique({
      where: { customerId },
      include: { tasks: { orderBy: [{ sortOrder: 'asc' }, { dueDate: 'asc' }] } },
    });
  },
};

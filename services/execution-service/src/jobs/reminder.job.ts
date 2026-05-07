/**
 * execution-service/src/jobs/reminder.job.ts
 *
 * Scheduled job — runs daily (via cron) to check upcoming timeline tasks
 * and publish `event.task_due_reminder` events to the notification service.
 */

import { prisma } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';
import axios from 'axios';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification-service:4007';

// Days before due date to send reminders
const REMINDER_DAYS = [30, 14, 7, 3, 1, 0];

export async function runDailyReminderJob(): Promise<void> {
  logger.info('Running daily timeline reminder job');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let processed = 0;
  let errors = 0;

  for (const daysLeft of REMINDER_DAYS) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysLeft);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dueTasks = await prisma.timelineTask.findMany({
      where: {
        dueDate: { gte: targetDate, lte: endOfDay },
        status: { not: 'COMPLETED' },
        timeline: { weddingDate: { gte: today } }, // skip past weddings
      },
      include: {
        timeline: { select: { customerId: true, weddingDate: true, id: true } },
      },
      take: 500, // safety cap per run
    });

    for (const task of dueTasks) {
      try {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, {
          event: 'event.task_due_reminder',
          payload: {
            customerId: task.timeline.customerId,
            timelineId: task.timeline.id,
            taskId: task.id,
            taskTitle: task.title,
            daysLeft,
            dueDate: task.dueDate?.toISOString(),
          },
        });
        processed++;
      } catch (err: any) {
        logger.error({ err: err.message, taskId: task.id }, 'Failed to send reminder');
        errors++;
      }
    }
  }

  logger.info({ processed, errors }, 'Daily reminder job complete');
}

/**
 * Vendor check-in handler — called by execution route when vendor arrives
 */
export async function handleVendorCheckIn(payload: {
  bookingId: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  customerId: string;
}): Promise<void> {
  await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, {
    event: 'event.vendor_check_in',
    payload,
  });
}

/**
 * Event completion handler — all vendors checked in, event marked done
 */
export async function handleEventCompleted(payload: {
  bookingId: string;
  vendorId: string;
  customerId: string;
}): Promise<void> {
  await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, {
    event: 'event.completed',
    payload,
  });
}

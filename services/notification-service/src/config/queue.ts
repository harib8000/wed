import { Queue, Worker, Job } from 'bullmq';
import { config } from './index';

const redisUrl = new URL(config.REDIS_URL);
const connection = { host: redisUrl.hostname, port: parseInt(redisUrl.port || '6379') };

export const notificationQueue = new Queue('notifications', { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } });

export function startNotificationWorker(processor: (job: Job) => Promise<void>): Worker {
  return new Worker('notifications', processor, { connection, concurrency: 20 });
}

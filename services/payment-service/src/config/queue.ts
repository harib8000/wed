import { Queue, Worker, Job } from 'bullmq';
import { config } from './index';

const connection = { host: new URL(config.REDIS_URL).hostname, port: parseInt(new URL(config.REDIS_URL).port || '6379') };

export const escrowReleaseQueue = new Queue('escrow-release', { connection });

export function startEscrowWorker(
  processor: (job: Job) => Promise<void>
): Worker {
  return new Worker('escrow-release', processor, {
    connection,
    concurrency: 5,
  });
}

import { Queue } from 'bullmq';
import {Redis} from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl);

export const reminderQueueScheduler = new Queue('reminder-queue', { connection });

export const reminderQueue = new Queue('reminder-queue', {
  connection,
});

export async function addReminderJob(jobId: string, data: Record<string, any>, delayMs: number) {
  return reminderQueue.add(jobId, data, {
    jobId,
    delay: delayMs,
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 1000 * 60 * 5, // retry every 5 minutes
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}


export async function removeReminderJob(jobId: string) {
  const job = await reminderQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}

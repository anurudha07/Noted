import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { sendReminderEmail } from '../utils/mailer.js';
import { Note } from '../models/Note.js';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

//  Redis connection with maxRetriesPerRequest null
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null
});

// Worker for reminder jobs
export const reminderWorker = new Worker(
  'reminder-queue',
  async (job) => {
    const { noteId, userId, email, title, content } = job.data as {
      noteId: string;
      userId: string;
      email: string;
      title?: string;
      content?: string;
    };

    // Send email
    await sendReminderEmail(email, title || 'Note reminder', content || '');

    // Mark reminder as sent in DB
    await Note.findByIdAndUpdate(noteId, {
      'reminder.sent': true,
      'reminder.jobId': job.id?.toString(),
    });

    return { ok: true };
  },
  { connection }
);

// completed jobs
reminderWorker.on('completed', (job) => {
  console.log('Reminder job completed', job.id);
});

// failed jobs
reminderWorker.on('failed', (job, err) => {
  console.error('Reminder job failed', job?.id, err?.message || err);
});

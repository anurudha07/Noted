import { Queue } from 'bullmq';
export declare const reminderQueueScheduler: Queue<any, any, string, any, any, string>;
export declare const reminderQueue: Queue<any, any, string, any, any, string>;
export declare function addReminderJob(jobId: string, data: Record<string, any>, delayMs: number): Promise<import("bullmq").Job<any, any, string>>;
export declare function removeReminderJob(jobId: string): Promise<void>;
//# sourceMappingURL=reminderQueue.d.ts.map
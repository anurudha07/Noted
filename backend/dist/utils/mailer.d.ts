/** Send reminder email. Throws on failure so worker will retry. */
export declare function sendReminderEmail(to: string, subject: string, text: string): Promise<import("nodemailer/lib/smtp-transport/index.js").SentMessageInfo>;
//# sourceMappingURL=mailer.d.ts.map
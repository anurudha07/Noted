import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.FROM_EMAIL;

if (!host || !user || !pass || !from) {
  console.warn('SMTP credentials are not fully configured. Emails will fail if attempted.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, 
  auth: {
    user,
    pass,
  },
});

/** Send reminder email. Throws on failure so worker will retry. */
export async function sendReminderEmail(to: string, subject: string, text: string) {
  if (!transporter) throw new Error('Email transporter not initialized');
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: `<pre style="font-family:Inter,system-ui,Arial">${text}</pre>`,
  });

  console.log('Reminder email sent', info.messageId, 'to', to);
  return info;
}

import path from 'path';
import type { SendMessageResult } from '@/types';
import { getEmailTransporter } from './emailTransporter';
import { getEmailHTML, getEmailSubject } from '@/config/messages';

/**
 * Send DSA reminder email using the config template
 */
export async function sendDSAReminder(toEmail: string, userName: string): Promise<SendMessageResult> {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: getEmailSubject(userName),
    html: getEmailHTML(userName),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(process.cwd(), 'public', 'logo.png'),
        cid: 'logo'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email send error:', message);
    return { success: false, error: message };
  }
}

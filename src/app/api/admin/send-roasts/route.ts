import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users as usersTable, User } from '@/db/schema';
import { ne } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getEmailTransporter } from '@/lib/emailTransporter';
import { getWhatsAppMessage, getEmailHTML, getEmailSubject, getRandomRoast, getRandomInsult } from '@/config/messages';

async function sendEmail(user: User, customMessage?: string) {
  const transporter = getEmailTransporter();

  // Use custom message or generate from config
  const html = customMessage || getEmailHTML(user.name);
  const subject = getEmailSubject(user.name);

  const mailOptions = {
    from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: subject,
    html: html,
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
    return { success: false, error: message };
  }
}

async function sendWhatsApp(user: User, customMessage?: string) {
  if (!user.phoneNumber) {
    return { success: false, error: 'No phone number' };
  }

  // Use custom message or generate from config
  const message = customMessage || getWhatsAppMessage(user.name);

  try {
    return await sendWhatsAppMessage(user.phoneNumber, message);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to send WhatsApp';
    return { success: false, error: msg };
  }
}

export const POST = requireAdmin(async (req, adminUser) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { customEmailMessage, customWhatsAppMessage, sendEmail: shouldSendEmail = true, sendWhatsApp: shouldSendWhatsApp = true } = body;

    // Get all non-admin users
    const allUsers = await db.select()
      .from(usersTable)
      .where(ne(usersTable.role, 'admin'));

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      whatsappSkipped: 0,
      errors: [] as string[],
    };

    for (const user of allUsers) {
      // Send email
      if (shouldSendEmail) {
        const emailResult = await sendEmail(user, customEmailMessage);
        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.emailsFailed++;
          if (emailResult.error) {
            results.errors.push(`Email to ${user.email}: ${emailResult.error}`);
          }
        }
      }

      // Send WhatsApp
      if (shouldSendWhatsApp) {
        if (user.phoneNumber && user.phoneNumber.trim()) {
          const whatsappResult = await sendWhatsApp(user, customWhatsAppMessage);
          if (whatsappResult.success) {
            results.whatsappSent++;
          } else {
            results.whatsappFailed++;
            if (whatsappResult.error) {
              results.errors.push(`WhatsApp to ${user.phoneNumber}: ${whatsappResult.error}`);
            }
          }
        } else {
          results.whatsappSkipped++;
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      results,
      totalUsers: allUsers.length,
      usingCustomMessage: {
        email: !!customEmailMessage,
        whatsapp: !!customWhatsAppMessage,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send roasts';
    console.error('Admin send roasts error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

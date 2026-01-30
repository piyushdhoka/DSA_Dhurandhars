import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users as usersTable } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getEmailTransporter } from '@/lib/emailTransporter';
import { getCustomEmailHTML } from '@/config/messages';

async function sendCustomEmail(toEmail: string, userName: string, subject: string, message: string) {
  const transporter = getEmailTransporter();
  const html = getCustomEmailHTML(userName, subject, message);

  const mailOptions = {
    from: `"DSA Grinders" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
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
  } catch (error: any) {
    console.error(`Email send error for ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
}

export const POST = requireAdmin(async (req, user) => {
  try {
    const {
      userIds,
      messageType,
      emailSubject,
      emailMessage,
      whatsappMessage
    } = await req.json();

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    // Get selected users
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phoneNumber: usersTable.phoneNumber,
    }).from(usersTable).where(inArray(usersTable.id, userIds));

    if (users.length === 0) {
      return NextResponse.json({ error: 'No valid users found' }, { status: 400 });
    }

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      errors: [] as string[],
    };

    // Send messages to each user
    for (const targetUser of users) {
      // Send email
      if (messageType === 'email' || messageType === 'both') {
        try {
          const emailResult = await sendCustomEmail(targetUser.email, targetUser.name, emailSubject, emailMessage);
          if (emailResult.success) results.emailsSent++;
          else {
            results.emailsFailed++;
            results.errors.push(`Email failed for ${targetUser.name}: ${emailResult.error}`);
          }
        } catch (error: any) {
          results.emailsFailed++;
          results.errors.push(`Email failed for ${targetUser.name}: ${error.message}`);
        }
      }

      // Send WhatsApp
      if ((messageType === 'whatsapp' || messageType === 'both') && targetUser.phoneNumber) {
        try {
          const whatsappResult = await sendWhatsAppMessage(targetUser.phoneNumber, whatsappMessage);
          if (whatsappResult.success) results.whatsappSent++;
          else {
            results.whatsappFailed++;
            results.errors.push(`WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
          }
        } catch (error: any) {
          results.whatsappFailed++;
          results.errors.push(`WhatsApp failed for ${targetUser.name}: ${error.message}`);
        }
      } else if ((messageType === 'whatsapp' || messageType === 'both') && !targetUser.phoneNumber) {
        results.whatsappFailed++;
        results.errors.push(`WhatsApp skipped for ${targetUser.name}: No phone number`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalUsers: users.length,
    });

  } catch (error: any) {
    console.error('Admin send messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { MessageTemplate } from '@/models/MessageTemplate';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import nodemailer from 'nodemailer';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Replace template variables with actual values
function replaceTemplateVariables(content: string, user: any, roast: string = '', insult: string = ''): string {
  return content
    .replace(/\{userName\}/g, user.name)
    .replace(/\{email\}/g, user.email)
    .replace(/\{leetcodeUsername\}/g, user.leetcodeUsername)
    .replace(/\{roast\}/g, roast)
    .replace(/\{insult\}/g, insult);
}

async function sendTemplatedEmail(user: any, template: any, roast: string, insult: string) {
  const subject = replaceTemplateVariables(template.subject || 'DSA Grinders - Daily Reminder', user, roast, insult);
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  const mailOptions = {
    from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: subject,
    html: content,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendTemplatedWhatsApp(user: any, template: any, roast: string, insult: string) {
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  try {
    const result = await sendWhatsAppMessage(user.phoneNumber, content);
    return result;
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

export const POST = requireAdmin(async (req, user) => {
  try {
    await dbConnect();

    // Get active templates
    const whatsappTemplate = await MessageTemplate.findOne({
      type: 'whatsapp_roast',
      isActive: true
    });
    const emailTemplate = await MessageTemplate.findOne({
      type: 'email_roast',
      isActive: true
    });

    console.log('Admin triggered manual roast sending');

    // Get all users
    const users = await User.find({}).select('-password');

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 400 }
      );
    }

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      whatsappSkipped: 0,
      errors: [] as string[],
    };

    // For manual sends, these are usually empty unless you want to customize
    const batchRoast = '';
    const batchInsult = '';

    // Send roasts to each user
    for (const targetUser of users) {
      // Send email roast using template
      try {
        if (emailTemplate) {
          const emailResult = await sendTemplatedEmail(targetUser, emailTemplate, batchRoast, batchInsult);
          if (emailResult.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
            results.errors.push(`Email failed for ${targetUser.name}: ${emailResult.error}`);
          }
        }
      } catch (error: any) {
        results.emailsFailed++;
        results.errors.push(`Email failed for ${targetUser.name}: ${error.message}`);
      }

      // Send WhatsApp roast using template (only if phone number exists)
      if (targetUser.phoneNumber && targetUser.phoneNumber.trim()) {
        try {
          if (whatsappTemplate) {
            const whatsappResult = await sendTemplatedWhatsApp(targetUser, whatsappTemplate, batchRoast, batchInsult);
            if (whatsappResult.success) {
              results.whatsappSent++;
            } else {
              results.whatsappFailed++;
              results.errors.push(`WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
            }
          }
        } catch (error: any) {
          results.whatsappFailed++;
          results.errors.push(`WhatsApp failed for ${targetUser.name}: ${error.message}`);
        }
      } else {
        results.whatsappSkipped++;
      }

      // Small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Create summary
    const summary = [];
    if (results.emailsSent > 0) summary.push(`${results.emailsSent} email roasts sent`);
    if (results.emailsFailed > 0) summary.push(`${results.emailsFailed} email roasts failed`);
    if (results.whatsappSent > 0) summary.push(`${results.whatsappSent} WhatsApp roasts sent`);
    if (results.whatsappFailed > 0) summary.push(`${results.whatsappFailed} WhatsApp roasts failed`);
    if (results.whatsappSkipped > 0) summary.push(`${results.whatsappSkipped} WhatsApp skipped (no phone)`);

    return NextResponse.json({
      success: true,
      results,
      summary: summary.join(', '),
      totalUsers: users.length,
    });

  } catch (error: any) {
    console.error('Admin send roasts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
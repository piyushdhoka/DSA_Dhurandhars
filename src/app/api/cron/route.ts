import path from 'path';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, settings, User, Setting } from '@/db/schema';
import { eq, ne, and, notLike } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getEmailTransporter } from '@/lib/emailTransporter';
import { getWhatsAppMessage, getEmailHTML, getEmailSubject } from '@/config/messages';

// Helper function to check if today should be skipped
function shouldSkipToday(s: Setting): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Skip weekends if enabled
  if (s.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }

  // Check custom skip dates
  const today = now.toDateString();
  const customSkipDates = (s.customSkipDates as string[]) || [];
  if (customSkipDates.some((date: string) =>
    new Date(date).toDateString() === today
  )) {
    return true;
  }

  return false;
}

// Helper function to reset daily counters if needed
async function resetDailyCountersIfNeeded(s: Setting): Promise<Setting> {
  const now = new Date();
  const lastReset = s.lastResetDate ? new Date(s.lastResetDate) : new Date(0);

  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    const [updated] = await db.update(settings)
      .set({
        emailsSentToday: 0,
        whatsappSentToday: 0,
        lastResetDate: now,
      })
      .where(eq(settings.id, s.id))
      .returning();
    return updated;
  }

  return s;
}

// Helper function to check if current time matches any scheduled time
function isTimeToSend(scheduledTimes: string[] | undefined, timezone: string = 'Asia/Kolkata', devMode: boolean = false): boolean {
  if (devMode) return true;
  if (!scheduledTimes || scheduledTimes.length === 0) return false;

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-IN', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;

  return scheduledTimes.some(scheduledTime => {
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
    const scheduledMinutes = scheduledHour * 60 + scheduledMinute;
    return Math.abs(currentMinutes - scheduledMinutes) <= 15;
  });
}

// Send email using config template
async function sendConfigEmail(user: User) {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: getEmailSubject(user.name),
    html: getEmailHTML(user.name),
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

// Send WhatsApp using config template
async function sendConfigWhatsApp(user: User) {
  if (!user.phoneNumber) {
    return { success: false, error: 'No phone number' };
  }

  const message = getWhatsAppMessage(user.name);

  try {
    return await sendWhatsAppMessage(user.phoneNumber, message);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to send WhatsApp';
    console.error('WhatsApp send error:', msg);
    return { success: false, error: msg };
  }
}

export async function GET(req: Request) {
  // Auth check using CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  // In production, CRON_SECRET is required
  if (isProduction && !process.env.CRON_SECRET) {
    console.error('SECURITY: CRON_SECRET environment variable is not set in production');
    return new Response('Server configuration error', { status: 500 });
  }

  // If CRON_SECRET is set (required in production), validate it
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('Unauthorized cron access attempt');
      return new Response('Unauthorized - Include Authorization: Bearer <CRON_SECRET> header', { status: 401 });
    }
  } else if (isProduction) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Get automation settings
    let [s] = await db.select().from(settings).limit(1);
    if (!s) {
      [s] = await db.insert(settings).values({}).returning();
    }

    // Handle migration from old format to new format
    let needsUpdate = false;
    const updatePayload: Partial<Setting> = {};

    if (!s.emailSchedule || (s.emailSchedule as string[]).length === 0) {
      updatePayload.emailSchedule = ["09:00"];
      needsUpdate = true;
    }
    if (!s.whatsappSchedule || (s.whatsappSchedule as string[]).length === 0) {
      updatePayload.whatsappSchedule = ["09:30"];
      needsUpdate = true;
    }

    if (needsUpdate) {
      [s] = await db.update(settings).set(updatePayload).where(eq(settings.id, s.id)).returning();
    }

    // Reset daily counters if needed
    s = await resetDailyCountersIfNeeded(s);

    const isDevelopment = process.env.NODE_ENV === 'development' ||
      req.headers.get('x-development-mode') === 'true';

    if (!s.automationEnabled) {
      return NextResponse.json({
        message: 'Automation disabled',
        automationEnabled: false
      });
    }

    if (shouldSkipToday(s)) {
      return NextResponse.json({
        message: 'Day skipped due to settings',
        skipped: true
      });
    }

    const shouldSendEmails = s.emailAutomationEnabled &&
      isTimeToSend(s.emailSchedule as string[], s.timezone || undefined, isDevelopment) &&
      (s.emailsSentToday ?? 0) < (s.maxDailyEmails ?? 1);

    const shouldSendWhatsApp = s.whatsappAutomationEnabled &&
      isTimeToSend(s.whatsappSchedule as string[], s.timezone || undefined, isDevelopment) &&
      (s.whatsappSentToday ?? 0) < (s.maxDailyWhatsapp ?? 1);

    if (!shouldSendEmails && !shouldSendWhatsApp) {
      return NextResponse.json({
        message: 'Not time to send messages or daily limits reached',
        shouldSendEmails,
        shouldSendWhatsApp,
        currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: s.timezone || 'Asia/Kolkata' }),
        emailSchedule: s.emailSchedule,
        whatsappSchedule: s.whatsappSchedule
      });
    }

    // Exclude admin accounts and pending profiles
    const allUsers = await db.select().from(users).where(
      and(
        ne(users.role, 'admin'),
        notLike(users.leetcodeUsername, 'pending_%')
      )
    );

    interface UserResult {
      username: string;
      email: string;
      phoneNumber: string | null;
      statsUpdate: { success: boolean; error?: string };
      emailSent: { success: boolean; skipped?: boolean; reason?: string; error?: string };
      whatsappSent: { success: boolean; skipped?: boolean; reason?: string; error?: string };
    }

    const results: UserResult[] = [];
    let emailsSentCount = 0;
    let whatsappSentCount = 0;

    for (const user of allUsers) {
      const userResult: UserResult = {
        username: user.leetcodeUsername,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        statsUpdate: { success: false },
        emailSent: { success: false, skipped: false },
        whatsappSent: { success: false, skipped: false }
      };

      // Update LeetCode stats
      try {
        await updateDailyStatsForUser(user.id, user.leetcodeUsername);
        userResult.statsUpdate = { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stats update failed';
        userResult.statsUpdate = { success: false, error: message };
      }

      // Send email
      if (shouldSendEmails && emailsSentCount + (s.emailsSentToday ?? 0) < (s.maxDailyEmails ?? 1)) {
        try {
          const emailResult = await sendConfigEmail(user);
          userResult.emailSent = emailResult;
          if (emailResult.success) emailsSentCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Email failed';
          userResult.emailSent = { success: false, error: message };
        }
      } else {
        userResult.emailSent = { success: false, skipped: true, reason: 'Not time or limit reached' };
      }

      // Send WhatsApp
      if (shouldSendWhatsApp && whatsappSentCount + (s.whatsappSentToday ?? 0) < (s.maxDailyWhatsapp ?? 1) && user.phoneNumber) {
        try {
          const whatsappResult = await sendConfigWhatsApp(user);
          userResult.whatsappSent = whatsappResult;
          if (whatsappResult.success) whatsappSentCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'WhatsApp failed';
          userResult.whatsappSent = { success: false, error: message };
        }
      } else {
        const reason = !shouldSendWhatsApp ? 'Not time or limit reached' : !user.phoneNumber ? 'No phone number' : 'Limit reached';
        userResult.whatsappSent = { success: false, skipped: true, reason };
      }

      results.push(userResult);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update settings with new counts
    await db.update(settings).set({
      emailsSentToday: (s.emailsSentToday ?? 0) + emailsSentCount,
      whatsappSentToday: (s.whatsappSentToday ?? 0) + whatsappSentCount,
      lastEmailSent: emailsSentCount > 0 ? new Date() : s.lastEmailSent,
      lastWhatsappSent: whatsappSentCount > 0 ? new Date() : s.lastWhatsappSent,
    }).where(eq(settings.id, s.id));

    const summary = {
      totalUsers: allUsers.length,
      statsUpdated: results.filter(r => r.statsUpdate.success).length,
      emailsSent: emailsSentCount,
      whatsappSent: whatsappSentCount,
      emailsSkipped: results.filter(r => r.emailSent.skipped).length,
      whatsappSkipped: results.filter(r => r.whatsappSent.skipped).length,
    };

    return NextResponse.json({
      message: 'Cron job completed successfully',
      summary,
      results: results.slice(0, 5)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cron job failed';
    console.error('Cron job error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

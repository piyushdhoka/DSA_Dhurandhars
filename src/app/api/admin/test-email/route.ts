import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getEmailTransporter } from '@/lib/emailTransporter';

export const POST = requireAdmin(async (req, user) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const transporter = getEmailTransporter();

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json({
        error: 'SMTP configuration error',
        details: verifyError.message
      }, { status: 500 });
    }

    const testMessage = {
      from: `"DSA Grinders Test" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Test Email - ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h1 style="color: #333; text-align: center;">DSA Grinders - Email Test</h1>
          <p style="color: #666; text-align: center;">This is a test email to verify SMTP configuration.</p>
          <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; text-align: center;">
              ✅ If you received this email, the SMTP configuration is working correctly!
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Sent at: ${new Date().toISOString()}<br>
            From: ${process.env.SMTP_EMAIL}
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(testMessage);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        response: info.response,
        to: email,
        from: process.env.SMTP_EMAIL
      }
    });

  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
});

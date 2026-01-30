import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const POST = requireAdmin(async (req, user) => {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const testMessage = message || `🔥 TEST MESSAGE FROM DSA GRINDERS 🔥

Hey there! This is a test message to verify WhatsApp integration is working.

If you received this, the system is working correctly! 🎉

Time: ${new Date().toLocaleString()}

---
DSA Grinders Admin Test`;

    console.log('Testing WhatsApp with:', {
      phoneNumber,
      messageLength: testMessage.length,
      apiKey: process.env.RPAY_API_KEY ? 'configured' : 'missing'
    });

    const result = await sendWhatsAppMessage(phoneNumber, testMessage);

    return NextResponse.json({
      success: result.success,
      result: result,
      testDetails: {
        phoneNumber,
        messageLength: testMessage.length,
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!process.env.RPAY_API_KEY
      }
    });

  } catch (error: any) {
    console.error('WhatsApp test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

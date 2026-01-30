import type { SendMessageResult } from '@/types';

/**
 * WhatsApp messaging via RPay Connect API
 * 
 * SECURITY NOTE: The RPay API requires api_key as a query parameter (their design).
 * This means the API key appears in URLs and may be logged in server access logs.
 * Mitigations:
 * - This code runs server-side only (API routes), never exposed to clients
 * - RPAY_API_KEY is an environment variable, not hardcoded
 */

const WHATSAPP_API_URL = 'https://rpayconnect.com/api/send-text';

interface WhatsAppAPIResponse {
  status: boolean;
  message?: string;
}

export async function sendDSAWhatsAppReminder(phoneNumber: string, userName: string): Promise<SendMessageResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dsa-grinders.vercel.app';
  // URLs must be on their own line to be clickable in WhatsApp
  const message = `🔥 *Oye ${userName}!* 🔥

It's time to grind some DSA problems!

💻 *LeetCode:*
https://leetcode.com/problemset/

🌐 *Website:*
${baseUrl}

Padh le bhai, mauka hai! 🚀`;

  return sendWhatsAppMessage(phoneNumber, message);
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<SendMessageResult> {
  const apiKey = process.env.RPAY_API_KEY;

  // Validate inputs
  if (!apiKey) {
    console.error('RPAY_API_KEY environment variable is not set');
    return { success: false, error: 'WhatsApp API key is not configured' };
  }

  if (!phoneNumber || !phoneNumber.trim()) {
    console.error('Phone number is empty or invalid');
    return { success: false, error: 'Phone number is required' };
  }

  if (!message || !message.trim()) {
    console.error('Message is empty');
    return { success: false, error: 'Message content is required' };
  }

  try {
    // Clean phone number - remove all non-digit characters except leading +
    let cleanPhoneNumber = phoneNumber.replace(/[\s-]/g, '');
    if (cleanPhoneNumber.startsWith('+')) {
      cleanPhoneNumber = cleanPhoneNumber.substring(1);
    }

    // Ensure it's only digits
    cleanPhoneNumber = cleanPhoneNumber.replace(/\D/g, '');

    if (!cleanPhoneNumber || cleanPhoneNumber.length < 10) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Build URL with parameters
    const url = new URL(WHATSAPP_API_URL);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('number', cleanPhoneNumber);
    url.searchParams.append('msg', message);

    console.log(`Sending WhatsApp to: ${cleanPhoneNumber.substring(0, 4)}****`);

    const response = await fetch(url.toString(), { method: 'GET' });

    // Try to parse response
    let data: WhatsAppAPIResponse;
    try {
      data = await response.json();
    } catch {
      // If response isn't JSON, treat as error
      const text = await response.text();
      throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}`);
    }

    if (!response.ok || data.status === false) {
      throw new Error(data.message || 'WhatsApp API error');
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message';
    console.error('WhatsApp send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

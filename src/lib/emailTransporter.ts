import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Singleton transporter instance
let transporter: Transporter | null = null;


export function getEmailTransporter(): Transporter {
    if (!transporter) {
        if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
            console.warn('Email transporter: SMTP credentials not configured');
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            // Connection pool settings
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000, // 1 second between batches
            rateLimit: 10, // Max 10 messages per rateDelta
        });
    }

    return transporter;
}


export async function verifyEmailTransporter(): Promise<boolean> {
    try {
        const t = getEmailTransporter();
        await t.verify();
        return true;
    } catch (error) {
        console.error('Email transporter verification failed:', error);
        return false;
    }
}

/**
 * Standard email sending options
 */
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: string;
        cid?: string;
    }>;
}

/**
 * Send an email using the shared transporter
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
        const t = getEmailTransporter();

        await t.sendMail({
            from: `"DSA Grinders" <${process.env.SMTP_EMAIL}>`,
            ...options,
        });

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send email';
        console.error('Email send error:', message);
        return { success: false, error: message };
    }
}

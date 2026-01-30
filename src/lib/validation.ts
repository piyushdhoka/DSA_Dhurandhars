/**
 * API Request Validation Schemas
 * 
 * Centralized Zod schemas for validating API request bodies.
 * This ensures type safety and provides clear error messages.
 */

import { z } from 'zod';

// ============================================================
// User Profile Schemas
// ============================================================

export const profileUpdateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    phoneNumber: z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (e.g., +1234567890)')
        .optional()
        .nullable(),
    github: z.string().max(255).optional(),
    linkedin: z.string().max(255).optional().nullable(),
    leetcodeUsername: z.string().min(1).max(255).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ============================================================
// Authentication Schemas
// ============================================================

export const authSyncSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1).max(255),
    leetcodeUsername: z.string().max(255).optional(),
    github: z.string().max(255).optional(),
    linkedin: z.string().max(255).optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
});

export type AuthSyncInput = z.infer<typeof authSyncSchema>;

// ============================================================
// Group Schemas
// ============================================================

export const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(255),
    description: z.string().max(1000).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z.object({
    code: z.string().min(1, 'Group code is required').max(32),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

// ============================================================
// Admin Schemas
// ============================================================

export const adminLoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const settingsUpdateSchema = z.object({
    automationEnabled: z.boolean().optional(),
    emailAutomationEnabled: z.boolean().optional(),
    whatsappAutomationEnabled: z.boolean().optional(),
    emailSchedule: z.array(z.string()).optional(),
    whatsappSchedule: z.array(z.string()).optional(),
    timezone: z.string().max(64).optional(),
    maxDailyEmails: z.number().int().min(0).max(100).optional(),
    maxDailyWhatsapp: z.number().int().min(0).max(100).optional(),
    skipWeekends: z.boolean().optional(),
    skipHolidays: z.boolean().optional(),
    customSkipDates: z.array(z.string()).optional(),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;



export const messageTemplateSchema = z.object({
    type: z.enum(['email', 'whatsapp']),
    name: z.string().min(1).max(255),
    subject: z.string().max(255).optional(),
    content: z.string().min(1),
    variables: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;


export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodIssue[] } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format error message
    const firstError = result.error.issues[0];
    const errorMessage = `${firstError.path.join('.')}: ${firstError.message}`.replace(/^: /, '');

    return {
        success: false,
        error: errorMessage,
        details: result.error.issues,
    };
}



export interface ApiSuccessResponse<T = unknown> {
    data?: T;
    message?: string;
}

export interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: z.ZodIssue[];
}


export function createErrorResponse(error: string, code?: string, details?: z.ZodIssue[]): ApiErrorResponse {
    const response: ApiErrorResponse = { error };
    if (code) response.code = code;
    if (details) response.details = details;
    return response;
}

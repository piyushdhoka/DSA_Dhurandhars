import { NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from './supabase';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '@/types';

// Environment variable with fallback for development
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-in-production' : '');

if (!process.env.ADMIN_SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_SESSION_SECRET environment variable is required in production');
    } else {
        console.warn('ADMIN_SESSION_SECRET not set - using development fallback. Set this in production!');
    }
}

export async function getCurrentUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Try manual admin token first
        try {
            const decoded = jwt.verify(token, ADMIN_SESSION_SECRET!) as { role?: string; manual?: boolean };
            if (decoded && decoded.role === 'admin' && decoded.manual) {
                return { id: 'manual_admin', name: 'Manual Admin', role: 'admin' as const, isProfileIncomplete: false as const };
            }
        } catch (e) {
            // Not a manual token, continue to Supabase
        }

        // 2. Try Supabase token
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (error || !supabaseUser) return null;

        const email = supabaseUser.email?.toLowerCase();
        if (!email) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) return null;

        return { ...user, isProfileIncomplete: isProfileIncomplete(user) };
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

export function isProfileIncomplete(user: User | any): boolean {
    if (!user) return true;
    return (
        !user.leetcodeUsername ||
        user.leetcodeUsername.startsWith('pending_') ||
        !user.github ||
        user.github === 'pending' ||
        !user.phoneNumber ||
        !user.linkedin
    );
}

// Type for authenticated users (manual admin or database user)
type ManualAdmin = { id: string; name: string; role: 'admin'; isProfileIncomplete: false };
type DatabaseUser = User & { isProfileIncomplete: boolean };
export type AuthUser = ManualAdmin | DatabaseUser;

type AuthenticatedHandler = (req: NextRequest, user: AuthUser, context?: unknown) => Promise<Response>;

export function requireAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest, context?: unknown) => {
        const user = await getCurrentUser(req);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Block actions if profile is incomplete (except for profile update route)
        const isProfileUpdate = req.nextUrl.pathname === '/api/users/profile';
        if (user.isProfileIncomplete && !isProfileUpdate) {
            return new Response(JSON.stringify({ error: 'Profile completion required', isProfileIncomplete: true }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return handler(req, user, context);
    };
}

// Admin auth middleware - checks for admin role in database
type AdminHandler = (req: NextRequest, user: AuthUser) => Promise<Response>;

export function requireAdmin(handler: AdminHandler) {
    return async (req: NextRequest) => {
        const user = await getCurrentUser(req);

        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access denied' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return handler(req, user);
    };
}

/**
 * Simple in-memory rate limiter for API routes
 * 
 * Note: This is an in-memory implementation suitable for single-instance deployments.
 * For production with multiple instances (Vercel Edge, etc.), consider:
 * - Vercel KV (Redis)
 * - Upstash Rate Limit
 * - Database-backed rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store with automatic cleanup
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetTime < now) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number; // seconds until reset
    limit: number;
}

export interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
    /** Identifier for this rate limit (e.g., 'leaderboard', 'sync') */
    identifier: string;
}

/**
 * Check and update rate limit for a given key
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const storeKey = `${config.identifier}:${key}`;
    const windowMs = config.windowSeconds * 1000;

    const entry = rateLimitStore.get(storeKey);

    // If no entry or window expired, create new entry
    if (!entry || entry.resetTime < now) {
        rateLimitStore.set(storeKey, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            allowed: true,
            remaining: config.limit - 1,
            resetIn: config.windowSeconds,
            limit: config.limit,
        };
    }

    // Increment count and check limit
    entry.count++;
    const allowed = entry.count <= config.limit;
    const remaining = Math.max(0, config.limit - entry.count);
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return {
        allowed,
        remaining,
        resetIn,
        limit: config.limit,
    };
}

/**
 * Get client identifier from request (IP address)
 * Handles various proxy headers
 */
export function getClientIdentifier(req: Request): string {
    // Check various headers for the real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Take the first IP in the chain (client IP)
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Vercel-specific header
    const vercelId = req.headers.get('x-vercel-forwarded-for');
    if (vercelId) {
        return vercelId.split(',')[0].trim();
    }

    // Fallback - in development this might be undefined
    return 'unknown';
}

/**
 * Pre-configured rate limits for different API types
 */
export const RATE_LIMITS = {
    /** Standard API calls - 60 requests per minute */
    STANDARD: { limit: 60, windowSeconds: 60, identifier: 'standard' },

    /** LeetCode sync - 10 requests per minute (expensive) */
    LEETCODE_SYNC: { limit: 10, windowSeconds: 60, identifier: 'leetcode-sync' },

    /** Leaderboard - 30 requests per minute */
    LEADERBOARD: { limit: 30, windowSeconds: 60, identifier: 'leaderboard' },

    /** Auth operations - 20 requests per minute */
    AUTH: { limit: 20, windowSeconds: 60, identifier: 'auth' },

    /** Admin operations - 100 requests per minute */
    ADMIN: { limit: 100, windowSeconds: 60, identifier: 'admin' },
} as const;

/**
 * Helper to create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetIn.toString(),
    };
}

/**
 * Rate Limiter for ReachMasked
 * 
 * Uses in-memory store for development.
 * In production, replace with Upstash Redis for persistence across serverless instances.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// In-memory store (for development only)
// In production, use Upstash Redis: @upstash/ratelimit
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }, 60000); // Every minute
}

interface RateLimitConfig {
    /** Maximum requests allowed in window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
    /** True if this request hit the limit */
    limited: boolean;
    /** True if user should see CAPTCHA (after 50% of limit) */
    showCaptcha: boolean;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, config.limit - entry.count);
    const limited = entry.count > config.limit;

    // Show CAPTCHA after 50% of limit consumed
    const showCaptcha = entry.count > config.limit * 0.5;

    return {
        success: !limited,
        remaining,
        resetAt: entry.resetAt,
        limited,
        showCaptcha,
    };
}

/**
 * Hash an IP address for privacy
 */
export function hashIP(ip: string | null): string {
    if (!ip) return "unknown";

    // Simple hash for anonymization
    // In production, use a proper hash with salt
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `ip_${Math.abs(hash).toString(16)}`;
}

// Preset configurations
export const rateLimitConfigs = {
    /** Scan page views - generous limit */
    scan: {
        limit: 30,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },

    /** Contact actions - stricter limit */
    contact: {
        limit: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },

    /** Auth attempts - very strict */
    auth: {
        limit: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },
} as const;

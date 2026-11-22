import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

// In-memory sliding window cache with automatic cleanup
const store = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Extract client IP address accurately from standard proxy headers
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
  readonly limit: number;
}

/**
 * Check and record a rate limit hit for a given key (e.g. `pin:192.168.1.1`)
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredRecords();

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      retryAfterSeconds: 0,
      limit: config.maxRequests,
    };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      limit: config.maxRequests,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    retryAfterSeconds: 0,
    limit: config.maxRequests,
  };
}

// Preset configurations for different sensitivity levels
export const RATE_LIMITS = {
  // PIN brute-force guard: 5 failed attempts per 5 minutes per IP
  PIN_AUTH: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  // Order submission guard: 30 requests per 5 minutes per IP
  ORDER_CREATION: { maxRequests: 30, windowMs: 5 * 60 * 1000 },
  // Waiter call guard: 10 calls per 5 minutes per IP
  WAITER_CALL: { maxRequests: 10, windowMs: 5 * 60 * 1000 },
  // General mutating API: 60 requests per minute
  GENERAL_MUTATION: { maxRequests: 60, windowMs: 60 * 1000 },
} as const;

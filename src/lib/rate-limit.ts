/**
 * In-Memory Sliding Window Rate Limiter for Indian Pixel OS.
 * Protects public authentication and sensitive mutations against brute-force attacks.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000); // 15 mins
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 60 * 1000); // Clean every minute

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  resetTimeMs: number;
}

/**
 * Checks and records rate limit for a specific identifier (e.g. IP or email).
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTimeMs = oldestTimestamp + options.windowMs;
    return {
      isAllowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }

  record.timestamps.push(now);
  return {
    isAllowed: true,
    remaining: options.maxRequests - record.timestamps.length,
    resetTimeMs: now + options.windowMs,
  };
}

/**
 * Resets rate limit for an identifier (e.g. on successful login).
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}

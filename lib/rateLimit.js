/**
 * Lightweight in-memory sliding window rate limiter for serverless Route Handlers.
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    // Periodically prune stale entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.prune(), 5 * 60 * 1000).unref?.();
    }
  }

  /**
   * Checks if an IP has exceeded its allowed quota.
   *
   * @param {string} key Identifier (e.g., client IP)
   * @param {number} limit Maximum allowed requests in window
   * @param {number} windowMs Window duration in milliseconds (default 10 minutes)
   * @returns {{ success: boolean, limit: number, remaining: number, resetTime: number }}
   */
  check(key, limit = 20, windowMs = 10 * 60 * 1000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const resetTime = Math.ceil((oldest + windowMs - now) / 1000);
      return {
        success: false,
        limit,
        remaining: 0,
        resetTime: resetTime > 0 ? resetTime : 1,
      };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);

    return {
      success: true,
      limit,
      remaining: limit - timestamps.length,
      resetTime: Math.ceil(windowMs / 1000),
    };
  }

  prune() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((t) => now - t < maxAge);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }
}

// Global singleton across hot reloads in development
const globalRateLimiter = global._rateLimiter || new RateLimiter();
if (process.env.NODE_ENV !== "production") {
  global._rateLimiter = globalRateLimiter;
}

/**
 * Extracts client IP safely from request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export default globalRateLimiter;

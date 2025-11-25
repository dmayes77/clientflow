// Simple in-memory rate limiter
// For production at scale, consider using Redis-based solution like @upstash/ratelimit

class RateLimiter {
  constructor() {
    this.requests = new Map();
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.resetTime > 60 * 1000) {
        this.requests.delete(key);
      }
    }
  }

  check(identifier, limit = 100, windowMs = 60 * 1000) {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    if (now > record.resetTime) {
      // Window has passed, reset
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    if (record.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    // Increment count
    record.count++;
    return {
      success: true,
      remaining: limit - record.count,
      reset: record.resetTime,
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit API requests
 * @param {Request} request - Next.js request object
 * @param {Object} options - Rate limit options
 * @param {number} options.limit - Max requests per window (default: 100)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} - { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(request, options = {}) {
  const { limit = 100, windowMs = 60 * 1000 } = options;

  // Use IP address or API key as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  const apiKey = request.headers.get("x-api-key");

  // Prefer API key for identification, fall back to IP
  const identifier = apiKey || ip;

  return rateLimiter.check(identifier, limit, windowMs);
}

/**
 * Create rate limit response with appropriate headers
 */
export function createRateLimitResponse(result) {
  const headers = {
    "X-RateLimit-Limit": result.limit || 100,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  };

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

const buckets = new Map();

/**
 * Simple in-memory sliding-window rate limiter for API routes.
 */
export function checkRateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function getClientKey(req, prefix = "anon") {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || prefix;
  return ip;
}

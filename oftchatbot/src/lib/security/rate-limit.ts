type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, windowMs = 60_000, limit = 120): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

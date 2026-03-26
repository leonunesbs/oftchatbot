const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

interface RateLimitOptions {
  bucket: string;
  maxRequests: number;
  windowMs: number;
}

const buckets = new Map<string, RateLimitBucket>();

function nowMs() {
  return Date.now();
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp;

  return "unknown";
}

function cleanupExpiredBuckets(currentTimeMs: number) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAtMs <= currentTimeMs) {
      buckets.delete(key);
    }
  }
}

export function applyRateLimit(request: Request, options: RateLimitOptions) {
  const currentTimeMs = nowMs();
  const ip = getClientIp(request);
  const key = `${options.bucket}:${ip}`;

  let state = buckets.get(key);
  if (!state || state.resetAtMs <= currentTimeMs) {
    state = {
      count: 0,
      resetAtMs: currentTimeMs + options.windowMs,
    };
  }

  state.count += 1;
  buckets.set(key, state);

  if (state.count > options.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAtMs - currentTimeMs) / 1000));
    return new Response(
      JSON.stringify({
        error: "Too many requests",
      }),
      {
        status: 429,
        headers: {
          ...JSON_HEADERS,
          "retry-after": String(retryAfterSeconds),
        },
      },
    );
  }

  if (buckets.size > 10_000) {
    cleanupExpiredBuckets(currentTimeMs);
  }

  return null;
}

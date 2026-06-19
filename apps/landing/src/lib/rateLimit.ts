// Per-IP rate limit for /api/consult.
//
// MVP: in-memory fixed-window counter per client key. One bucket
// per IP, configurable via RATE_LIMIT_PER_MIN (default 10, window
// is always 60 s). Multi-worker production needs Redis; this
// module's interface is shaped so the storage backend can be
// swapped without touching the route handler.
//
// Behaviour:
//   check(key) → { allowed, limit, remaining, retryAfterMs, resetAt }
//   First N calls in the window are allowed; (N+1)th returns
//   allowed=false with retryAfterMs pointing at the window reset.
//   After resetAt, the counter starts fresh.
//
// IP source order: x-forwarded-for (first hop) → x-real-ip → "unknown".
// The "unknown" bucket is shared by all requests that arrive without
// either header; it is the worst case for rate limit granularity but
// acceptable for the lite tier. Phase 2 (Pro tier) should require
// a verified client identifier and drop the unknown bucket.

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60_000;

function readConfig(): RateLimitConfig {
  const rawLimit = process.env.RATE_LIMIT_PER_MIN;
  const parsed = rawLimit === undefined ? NaN : Number.parseInt(rawLimit, 10);
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LIMIT;
  return { limit, windowMs: DEFAULT_WINDOW_MS };
}

export class TokenBucketRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(config: RateLimitConfig = readConfig()) {
    this.limit = config.limit;
    this.windowMs = config.windowMs;
  }

  getLimit(): number {
    return this.limit;
  }

  getWindowMs(): number {
    return this.windowMs;
  }

  check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit - 1,
        retryAfterMs: 0,
        resetAt: now + this.windowMs,
      };
    }
    if (existing.count >= this.limit) {
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        retryAfterMs: existing.resetAt - now,
        resetAt: existing.resetAt,
      };
    }
    existing.count += 1;
    return {
      allowed: true,
      limit: this.limit,
      remaining: this.limit - existing.count,
      retryAfterMs: 0,
      resetAt: existing.resetAt,
    };
  }

  reset(): void {
    this.buckets.clear();
  }

  size(): number {
    return this.buckets.size;
  }
}

type HeadersLike = { get(name: string): string | null };

export function getClientIp(request: { headers: HeadersLike }): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }
  return "unknown";
}

export const consultRateLimiter = new TokenBucketRateLimiter();

export function __resetRateLimitForTests(): void {
  consultRateLimiter.reset();
}

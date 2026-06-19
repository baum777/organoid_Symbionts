import { describe, expect, it } from "vitest";

import {
  TokenBucketRateLimiter,
  getClientIp,
} from "@/lib/rateLimit";

describe("TokenBucketRateLimiter", () => {
  it("allows up to `limit` calls within the window, then denies", () => {
    const rl = new TokenBucketRateLimiter({ limit: 3, windowMs: 60_000 });
    const t0 = 1_700_000_000_000;

    const r1 = rl.check("ip-1", t0);
    const r2 = rl.check("ip-1", t0 + 1_000);
    const r3 = rl.check("ip-1", t0 + 2_000);
    const r4 = rl.check("ip-1", t0 + 3_000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the counter once the window has elapsed", () => {
    const rl = new TokenBucketRateLimiter({ limit: 2, windowMs: 1_000 });
    const t0 = 1_700_000_000_000;

    expect(rl.check("ip-1", t0).allowed).toBe(true);
    expect(rl.check("ip-1", t0 + 100).allowed).toBe(true);
    expect(rl.check("ip-1", t0 + 200).allowed).toBe(false);

    const afterReset = rl.check("ip-1", t0 + 1_100);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it("keeps buckets per key independent", () => {
    const rl = new TokenBucketRateLimiter({ limit: 1, windowMs: 60_000 });
    const t0 = 1_700_000_000_000;

    expect(rl.check("ip-1", t0).allowed).toBe(true);
    expect(rl.check("ip-2", t0).allowed).toBe(true);
    expect(rl.check("ip-1", t0 + 1).allowed).toBe(false);
    expect(rl.check("ip-2", t0 + 1).allowed).toBe(false);
  });

  it("reports retryAfterMs roughly equal to the time until window reset", () => {
    const rl = new TokenBucketRateLimiter({ limit: 1, windowMs: 10_000 });
    const t0 = 1_700_000_000_000;

    rl.check("ip-1", t0);
    const denied = rl.check("ip-1", t0 + 2_500);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBe(7_500);
  });

  it("reset() clears all buckets and the size drops to zero", () => {
    const rl = new TokenBucketRateLimiter({ limit: 5, windowMs: 60_000 });
    rl.check("a");
    rl.check("b");
    expect(rl.size()).toBe(2);
    rl.reset();
    expect(rl.size()).toBe(0);
  });

  it("exposes the configured limit and window via getters", () => {
    const rl = new TokenBucketRateLimiter({ limit: 7, windowMs: 30_000 });
    expect(rl.getLimit()).toBe(7);
    expect(rl.getWindowMs()).toBe(30_000);
  });
});

describe("getClientIp", () => {
  function mockHeaders(map: Record<string, string>) {
    const lower: Record<string, string> = {};
    for (const k of Object.keys(map)) lower[k.toLowerCase()] = map[k];
    return {
      get(name: string): string | null {
        return lower[name.toLowerCase()] ?? null;
      },
    };
  }

  it("reads the first IP from x-forwarded-for", () => {
    const ip = getClientIp({ headers: mockHeaders({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }) });
    expect(ip).toBe("1.2.3.4");
  });

  it("trims whitespace around x-forwarded-for entries", () => {
    const ip = getClientIp({ headers: mockHeaders({ "x-forwarded-for": "  1.2.3.4  ,  10.0.0.1  " }) });
    expect(ip).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const ip = getClientIp({ headers: mockHeaders({ "x-real-ip": "5.6.7.8" }) });
    expect(ip).toBe("5.6.7.8");
  });

  it("prefers x-forwarded-for over x-real-ip when both are present", () => {
    const ip = getClientIp({
      headers: mockHeaders({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }),
    });
    expect(ip).toBe("1.1.1.1");
  });

  it("returns 'unknown' when no IP header is present", () => {
    const ip = getClientIp({ headers: mockHeaders({}) });
    expect(ip).toBe("unknown");
  });

  it("ignores empty / whitespace-only x-forwarded-for and falls through", () => {
    const ip = getClientIp({
      headers: mockHeaders({ "x-forwarded-for": "   ", "x-real-ip": "9.9.9.9" }),
    });
    expect(ip).toBe("9.9.9.9");
  });
});

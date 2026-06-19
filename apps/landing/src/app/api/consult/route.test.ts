import { beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { POST } from "@/app/api/consult/route";
import { GET } from "@/app/api/health/route";
import { __resetRateLimitForTests } from "@/lib/rateLimit";

type RouteRequest = NextRequest;

class MockNextRequest {
  private readonly _body: string;
  readonly headers: { get(name: string): string | null };
  constructor(body: unknown, headers: Record<string, string> = {}) {
    this._body = typeof body === "string" ? body : JSON.stringify(body);
    const lower: Record<string, string> = {};
    for (const k of Object.keys(headers)) lower[k.toLowerCase()] = headers[k];
    this.headers = {
      get(name: string): string | null {
        return lower[name.toLowerCase()] ?? null;
      },
    };
  }
  async json(): Promise<unknown> {
    return JSON.parse(this._body);
  }
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): RouteRequest {
  return new MockNextRequest(body, headers) as unknown as RouteRequest;
}

describe("/api/consult route", () => {
  it("returns 200 with a structured ConsultResponse for a valid payload", async () => {
    const response = await POST(
      makeRequest({
        signal: "Soll ich meinen Job kuendigen?",
        context: "life",
        posture: "empathisch",
        locale: "de",
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(typeof body.requestId).toBe("string");
    expect(typeof body.phase).toBe("string");
    expect(typeof body.lead).toBe("object");
    expect(body.lead).toBeTruthy();
  });

  it("returns 400 + signal_too_long when the signal exceeds the 4000-char cap", async () => {
    const response = await POST(
      makeRequest({
        signal: "a".repeat(4001),
        context: "life",
        posture: "empathisch",
        locale: "de",
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; maxChars: number };
    expect(body.error).toBe("signal_too_long");
    expect(body.maxChars).toBe(4000);
  });

  it("returns 400 + invalid_context for an unknown context", async () => {
    const response = await POST(
      makeRequest({
        signal: "valid",
        context: "work",
        posture: "empathisch",
        locale: "de",
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("invalid_context");
  });

  it("returns 400 + invalid_posture for an unknown posture", async () => {
    const response = await POST(
      makeRequest({
        signal: "valid",
        context: "life",
        posture: "neutral",
        locale: "de",
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("invalid_posture");
  });

  it("returns 400 + invalid_locale for a non-de/en locale", async () => {
    const response = await POST(
      makeRequest({
        signal: "valid",
        context: "life",
        posture: "empathisch",
        locale: "fr",
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("invalid_locale");
  });

  it("returns 400 for non-JSON or malformed bodies", async () => {
    const response = await POST(
      new MockNextRequest("not json {{{") as unknown as RouteRequest,
    );
    expect(response.status).toBe(400);
  });
});

describe("/api/health route", () => {
  it("returns 200 with status=ok and the surface marker", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("consult");
    expect(body.surface).toBe("practice");
    expect(body.week).toBe(3);
  });
});

// ── Per-IP rate limit (slice 4.2) ───────────────────────────────────
// These tests run last so the in-memory rate-limit bucket is shared
// with the earlier tests in this file (they use the "unknown" IP).
// beforeEach clears the bucket so each test starts at count=0.

describe("/api/consult route — rate limit (slice 4.2)", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it("returns 200 + X-RateLimit-* headers on the first 10 requests from the same IP", async () => {
    for (let i = 0; i < 10; i++) {
      const response = await POST(
        makeRequest(
          { signal: `frage nummer ${i}`, context: "life", posture: "empathisch", locale: "de" },
          { "x-forwarded-for": "10.0.0.1" },
        ),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      const remaining = Number(response.headers.get("X-RateLimit-Remaining"));
      expect(Number.isFinite(remaining)).toBe(true);
      expect(remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns 429 + retryAfter + Retry-After header on the 11th request from the same IP", async () => {
    for (let i = 0; i < 10; i++) {
      const r = await POST(
        makeRequest(
          { signal: `warm up ${i}`, context: "life", posture: "empathisch", locale: "de" },
          { "x-forwarded-for": "10.0.0.2" },
        ),
      );
      expect(r.status).toBe(200);
    }
    const blocked = await POST(
      makeRequest(
        { signal: "blocked", context: "life", posture: "empathisch", locale: "de" },
        { "x-forwarded-for": "10.0.0.2" },
      ),
    );
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string; retryAfter: number };
    expect(body.error).toBe("rate_limited");
    expect(typeof body.retryAfter).toBe("number");
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.retryAfter).toBeLessThanOrEqual(60);
    expect(blocked.headers.get("Retry-After")).toBe(String(body.retryAfter));
    expect(blocked.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("counts per-IP — different IPs do not share a bucket", async () => {
    for (let i = 0; i < 10; i++) {
      const r = await POST(
        makeRequest(
          { signal: `ip a ${i}`, context: "life", posture: "empathisch", locale: "de" },
          { "x-forwarded-for": "10.0.0.3" },
        ),
      );
      expect(r.status).toBe(200);
    }
    const r11a = await POST(
      makeRequest(
        { signal: "ip a 11", context: "life", posture: "empathisch", locale: "de" },
        { "x-forwarded-for": "10.0.0.3" },
      ),
    );
    expect(r11a.status).toBe(429);

    const rB = await POST(
      makeRequest(
        { signal: "ip b 1", context: "life", posture: "empathisch", locale: "de" },
        { "x-forwarded-for": "10.0.0.4" },
      ),
    );
    expect(rB.status).toBe(200);
  });

  it("uses the first IP when x-forwarded-for is a comma-separated chain", async () => {
    for (let i = 0; i < 10; i++) {
      const r = await POST(
        makeRequest(
          { signal: `chain ${i}`, context: "life", posture: "empathisch", locale: "de" },
          { "x-forwarded-for": "10.0.0.5, 192.168.0.1, 10.10.10.10" },
        ),
      );
      expect(r.status).toBe(200);
    }
    const blocked = await POST(
      makeRequest(
        { signal: "chain blocked", context: "life", posture: "empathisch", locale: "de" },
        { "x-forwarded-for": "10.0.0.5, 192.168.0.1" },
      ),
    );
    expect(blocked.status).toBe(429);
  });
});

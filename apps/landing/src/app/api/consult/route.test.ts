import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { POST } from "@/app/api/consult/route";
import { GET } from "@/app/api/health/route";

type RouteRequest = NextRequest;

class MockNextRequest {
  private readonly _body: string;
  constructor(body: unknown) {
    this._body = typeof body === "string" ? body : JSON.stringify(body);
  }
  async json(): Promise<unknown> {
    return JSON.parse(this._body);
  }
}

function makeRequest(body: unknown): RouteRequest {
  return new MockNextRequest(body) as unknown as RouteRequest;
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

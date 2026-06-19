import { NextResponse, type NextRequest } from "next/server";

import { runConsult, type RunConsultError } from "@/lib/consult-runner";
import type {
  ConsultContext,
  ConsultLocale,
  ConsultPosture,
} from "@/lib/consult/constants";
import { consultRateLimiter, getClientIp } from "@/lib/rateLimit";
import type { ConsultErrorBody } from "@/lib/consult/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_CONTEXTS: ReadonlyArray<ConsultContext> = ["life", "reflection", "creative"];
const VALID_POSTURES: ReadonlyArray<ConsultPosture> = ["sachlich", "empathisch", "konfrontativ"];
const VALID_LOCALES: ReadonlyArray<ConsultLocale> = ["de", "en"];

function isOneOf<T extends string>(value: unknown, allowed: ReadonlyArray<T>): value is T {
  return typeof value === "string" && (allowed as ReadonlyArray<string>).includes(value);
}

function errorResponse(
  error: ConsultErrorBody,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(error, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...extraHeaders,
    },
  });
}

function mapError(error: RunConsultError): { body: ConsultErrorBody; status: number } {
  switch (error.code) {
    case "signal_too_long":
      return {
        body: { error: "signal_too_long", maxChars: error.maxChars },
        status: 400,
      };
    case "signal_too_short":
      return {
        body: { error: "signal_too_short", minChars: error.minChars },
        status: 400,
      };
    case "invalid_context":
      return { body: { error: "invalid_context" }, status: 400 };
    case "invalid_posture":
      return { body: { error: "invalid_posture" }, status: 400 };
    case "invalid_locale":
      return { body: { error: "invalid_locale" }, status: 400 };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- 1. Per-IP rate limit (before any body work) ---------------------
  // Fails closed: an attacker who floods the endpoint hits the limit
  // before we parse JSON or run the clinical guard. The IP comes from
  // x-forwarded-for (first hop) → x-real-ip → "unknown".
  const ip = getClientIp(request);
  const rl = consultRateLimiter.check(ip);
  if (!rl.allowed) {
    const retryAfter = Math.ceil(rl.retryAfterMs / 1000);
    return errorResponse(
      { error: "rate_limited", retryAfter },
      429,
      {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
      },
    );
  }

  // --- 2. Body parse + field validation -------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse({ error: "invalid_context" }, 400);
  }

  if (!body || typeof body !== "object") {
    return errorResponse({ error: "invalid_context" }, 400);
  }

  const candidate = body as Record<string, unknown>;
  const context = candidate.context;
  const posture = candidate.posture;
  const locale = candidate.locale;
  const signal = candidate.signal;

  if (typeof signal !== "string") {
    return errorResponse({ error: "invalid_context" }, 400);
  }
  if (!isOneOf(context, VALID_CONTEXTS)) {
    return errorResponse({ error: "invalid_context" }, 400);
  }
  if (!isOneOf(posture, VALID_POSTURES)) {
    return errorResponse({ error: "invalid_posture" }, 400);
  }
  if (!isOneOf(locale, VALID_LOCALES)) {
    return errorResponse({ error: "invalid_locale" }, 400);
  }

  const result = runConsult({
    signal,
    context,
    posture,
    locale,
  });

  if (!result.ok) {
    const mapped = mapError(result.error);
    return errorResponse(mapped.body, mapped.status);
  }

  return NextResponse.json(result.response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-RateLimit-Limit": String(rl.limit),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
    },
  });
}

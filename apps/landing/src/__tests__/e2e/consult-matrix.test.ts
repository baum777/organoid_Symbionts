import { beforeAll, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { POST } from "@/app/api/consult/route";
import { __resetRateLimitForTests } from "@/lib/rateLimit";
import { practice } from "@/lib/content";
import type { ConsultResponse, ConsultVoice } from "@/lib/consult/types";

type Case = {
  context: "life" | "reflection" | "creative";
  posture: "sachlich" | "empathisch" | "konfrontativ";
  signal: string;
  expectedLead: string;
  expectedCounterweight: string;
  expectedAnchor: string | null;
};

// Context → lead/counterweight/anchor mapping mirrors CONTEXT_PHASE
// in apps/landing/src/lib/consult-runner.ts. Pinned here so a drift
// in the runner would surface as a failing test, not a silent shape
// change.
const CASES: ReadonlyArray<Case> = [
  // life
  { context: "life", posture: "sachlich", signal: "Soll ich meinen Job wechseln?", expectedLead: "horizon-drifter", expectedCounterweight: "root-sentinel", expectedAnchor: "stabil-core" },
  { context: "life", posture: "empathisch", signal: "Ich frage mich ob ich umziehen soll.", expectedLead: "horizon-drifter", expectedCounterweight: "root-sentinel", expectedAnchor: "stabil-core" },
  { context: "life", posture: "konfrontativ", signal: "Warum bleibe ich immer an Beziehungen haengen?", expectedLead: "horizon-drifter", expectedCounterweight: "root-sentinel", expectedAnchor: "stabil-core" },
  // reflection — anchor = lead, so anchor is suppressed to null
  { context: "reflection", posture: "sachlich", signal: "Mein Vater hat mir nie gesagt, dass er stolz ist.", expectedLead: "stabil-core", expectedCounterweight: "mycel-weaver", expectedAnchor: null },
  { context: "reflection", posture: "empathisch", signal: "Ich merke, dass ich ein Muster wiederhole.", expectedLead: "stabil-core", expectedCounterweight: "mycel-weaver", expectedAnchor: null },
  { context: "reflection", posture: "konfrontativ", signal: "Warum erlaube ich mir nie, gut zu mir zu sein?", expectedLead: "stabil-core", expectedCounterweight: "mycel-weaver", expectedAnchor: null },
  // creative
  { context: "creative", posture: "sachlich", signal: "Mein Protagonist ist auf Seite 87 festgefahren.", expectedLead: "spike-wave", expectedCounterweight: "horizon-drifter", expectedAnchor: "stabil-core" },
  { context: "creative", posture: "empathisch", signal: "Meine Geschichte fuehlt sich flach an.", expectedLead: "spike-wave", expectedCounterweight: "horizon-drifter", expectedAnchor: "stabil-core" },
  { context: "creative", posture: "konfrontativ", signal: "Warum schreibe ich immer das gleiche Buch?", expectedLead: "spike-wave", expectedCounterweight: "horizon-drifter", expectedAnchor: "stabil-core" },
];

const VALID_IDS = new Set(practice.embodiments.map((e) => e.id));
const VALID_PHASES = new Set([
  "Identity Dissolution",
  "Swarm Coherence",
  "Sovereign Propagation",
  "Ontological Restructuring",
  "Eternal Flow Horizon",
]);

const TEST_IP = "10.0.99.42";

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

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new MockNextRequest(body, headers) as unknown as NextRequest;
}

function voiceView(v: ConsultVoice | null): unknown {
  if (!v) return null;
  return {
    id: v.id,
    glyph: v.glyph,
    name: v.name,
    classical: v.classical,
  };
}

function stableView(r: ConsultResponse): unknown {
  return {
    phase: r.phase,
    phaseConfidence: r.phaseConfidence,
    lead: voiceView(r.lead),
    counterweight: voiceView(r.counterweight),
    anchor: voiceView(r.anchor),
    validation: {
      passed: r.validation.passed,
      mode: r.validation.mode,
      budgetChars: r.validation.budgetChars,
      actualChars: r.validation.actualChars,
    },
    evidence: {
      modelVersion: r.evidence.modelVersion,
    },
  };
}

describe("/api/consult — 9-case E2E matrix (slice 4.3)", () => {
  beforeAll(() => {
    __resetRateLimitForTests();
  });

  for (const c of CASES) {
    it(`${c.context} / ${c.posture} returns a stable, full-shape response`, async () => {
      const response = await POST(
        makeRequest(
          { signal: c.signal, context: c.context, posture: c.posture, locale: "de" },
          { "x-forwarded-for": TEST_IP },
        ),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("no-store");

      const body = (await response.json()) as ConsultResponse;

      // requestId is ULID-ish: 10-char base36 ts + 16-char uppercase hex = 26 chars
      expect(body.requestId).toMatch(/^[0-9A-Z]{26}$/);

      // lead / counterweight / anchor mapping
      expect(body.lead.id).toBe(c.expectedLead);
      expect(body.counterweight?.id).toBe(c.expectedCounterweight);
      expect(body.anchor?.id ?? null).toBe(c.expectedAnchor);

      // every voice id is a known embodiment
      expect(VALID_IDS.has(body.lead.id)).toBe(true);
      if (body.counterweight) expect(VALID_IDS.has(body.counterweight.id)).toBe(true);
      if (body.anchor) expect(VALID_IDS.has(body.anchor.id)).toBe(true);

      // phase is one of the 5 canonical phases
      expect(VALID_PHASES.has(body.phase)).toBe(true);
      expect(body.phaseConfidence).toBeGreaterThan(0);

      // validation: clean path → embodiment_reply, passed=true
      expect(body.validation.passed).toBe(true);
      expect(body.validation.mode).toBe("embodiment_reply");
      expect(body.validation.budgetChars).toBeGreaterThan(0);
      expect(body.validation.actualChars).toBeLessThanOrEqual(body.validation.budgetChars);

      // echo / suppressor are always null in the stub path
      expect(body.echo).toBeNull();
      expect(body.suppressor).toBeNull();

      // evidence
      expect(body.evidence.modelVersion).toBe("stub-week3");
      expect(body.evidence.signalHash).toMatch(/^sha256:[0-9a-f]{16}$/);
      expect(typeof body.evidence.seed).toBe("string");
      expect(body.evidence.seed).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // the posture-tail is appended only to the lead voice, not to
      // counterweight/anchor (this is the documented behaviour in
      // consult-runner.ts:154 and the test on line ~87 of
      // consult-runner.test.ts — pinned here at the route boundary)
      const POSTURE_TAIL: Record<typeof c.posture, string> = {
        sachlich: "Beobachten, nicht bewerten",
        empathisch: "Validieren, dann öffnen",
        konfrontativ: "Direkt fragen, nicht angreifen",
      };
      expect(body.lead.answer).toContain(POSTURE_TAIL[c.posture]);
      expect(body.counterweight?.answer ?? "").not.toContain(POSTURE_TAIL[c.posture]);
      if (body.anchor) expect(body.anchor.answer).not.toContain(POSTURE_TAIL[c.posture]);

      // golden snapshot of the stable view (requestId / signalHash /
      // seed stripped — those change per call)
      expect(stableView(body)).toMatchSnapshot();
    });
  }
});

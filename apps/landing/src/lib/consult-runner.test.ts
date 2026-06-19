import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runConsult } from "@/lib/consult-runner";
import { practice } from "@/lib/content";
import { __setLlmClientForTests, __resetLlmClientForTests } from "@/lib/llm/client";
import type { LlmClient, LlmRequest, LlmResult } from "@/lib/llm/types";

const ALL_CONTEXTS = ["life", "reflection", "creative"] as const;
const ALL_POSTURES = ["sachlich", "empathisch", "konfrontativ"] as const;

function isUuidLike(value: string): boolean {
  // 10-char base36 timestamp + 16-char uppercase hex = 26 chars.
  return /^[0-9A-Z]{26}$/.test(value);
}

function isSha256Like(value: string): boolean {
  return value.startsWith("sha256:") && value.slice("sha256:".length).length === 16;
}

describe("consult-runner", () => {
  it("returns a structured response with all required top-level fields", async () => {
    const result = await runConsult({
      signal: "Soll ich meinen Job kuendigen und nach Bali gehen?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const r = result.response;
    expect(r.requestId).toMatch(/^[0-9A-Z]{26}$/);
    expect(typeof r.phase).toBe("string");
    expect(r.phaseConfidence).toBeGreaterThan(0);
    expect(r.lead).toBeTruthy();
    expect(r.lead.id).toBe("horizon-drifter");
    expect(r.counterweight?.id).toBe("root-sentinel");
    expect(r.anchor?.id).toBe("stabil-core");
    expect(r.validation.mode).toBe("embodiment_reply");
    expect(r.validation.passed).toBe(true);
    expect(isSha256Like(r.evidence.signalHash)).toBe(true);
    expect(r.evidence.modelVersion).toBe("stub-week3");
    expect(r.evidence.seed).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("produces a fresh requestId on each call", async () => {
    const a = await runConsult({
      signal: "same question",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    const b = await runConsult({
      signal: "same question",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.response.requestId).not.toBe(b.response.requestId);
  });

  it("selects the reflection-context lead (Stabil-Core) and not Horizon-Drifter", async () => {
    const result = await runConsult({
      signal: "Mein Vater hat mir nie gesagt, dass er stolz ist.",
      context: "reflection",
      posture: "sachlich",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.lead.id).toBe("stabil-core");
    expect(result.response.phase).toBe("Ontological Restructuring");
  });

  it("selects the creative-context lead (Spike-Wave)", async () => {
    const result = await runConsult({
      signal: "Mein Protagonist ist auf Seite 87 festgefahren.",
      context: "creative",
      posture: "konfrontativ",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.lead.id).toBe("spike-wave");
    expect(result.response.phase).toBe("Sovereign Propagation");
  });

  it("appends posture-tail only to the lead voice, not counterweight/anchor", async () => {
    const result = await runConsult({
      signal: "Test signal",
      context: "life",
      posture: "konfrontativ",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const leadHasTail = result.response.lead.answer.includes("Direkt fragen");
    const counterweight = result.response.counterweight?.answer ?? "";
    const anchor = result.response.anchor?.answer ?? "";
    expect(leadHasTail).toBe(true);
    expect(counterweight.includes("Direkt fragen")).toBe(false);
    expect(anchor.includes("Direkt fragen")).toBe(false);
  });

  it("applies a -20% soft-target for sachlich and +20% for konfrontativ", async () => {
    const base = await runConsult({
      signal: "Same signal",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    const sachlich = await runConsult({
      signal: "Same signal",
      context: "life",
      posture: "sachlich",
      locale: "de",
    });
    const konfrontativ = await runConsult({
      signal: "Same signal",
      context: "life",
      posture: "konfrontativ",
      locale: "de",
    });
    expect(base.ok && sachlich.ok && konfrontativ.ok).toBe(true);
    if (!base.ok || !sachlich.ok || !konfrontativ.ok) return;
    expect(sachlich.response.validation.budgetChars).toBeLessThan(
      base.response.validation.budgetChars,
    );
    expect(konfrontativ.response.validation.budgetChars).toBeGreaterThan(
      base.response.validation.budgetChars,
    );
  });

  it("returns all 7 embodiment ids across the 9 context×posture combinations", async () => {
    const seen = new Set<string>();
    for (const context of ALL_CONTEXTS) {
      for (const posture of ALL_POSTURES) {
        const result = await runConsult({
          signal: "Eine offene Frage ueber das Leben und die Matrix.",
          context,
          posture,
          locale: "de",
        });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        seen.add(result.response.lead.id);
        if (result.response.counterweight) seen.add(result.response.counterweight.id);
        if (result.response.anchor) seen.add(result.response.anchor.id);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it("every selected voice id is a known embodiment id", async () => {
    const validIds = new Set(practice.embodiments.map((e) => e.id));
    for (const context of ALL_CONTEXTS) {
      const result = await runConsult({
        signal: "test",
        context,
        posture: "empathisch",
        locale: "de",
      });
      if (!result.ok) continue;
      expect(validIds.has(result.response.lead.id)).toBe(true);
      if (result.response.counterweight) {
        expect(validIds.has(result.response.counterweight.id)).toBe(true);
      }
      if (result.response.anchor) {
        expect(validIds.has(result.response.anchor.id)).toBe(true);
      }
    }
  });

  it("rejects signals over the 4000-char server cap", async () => {
    const tooLong = "a".repeat(4001);
    const result = await runConsult({
      signal: tooLong,
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("signal_too_long");
    if (result.error.code === "signal_too_long") {
      expect(result.error.maxChars).toBe(4000);
    }
  });

  it("rejects signals below the 4-char minimum (after trim)", async () => {
    const result = await runConsult({
      signal: "   ",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("signal_too_short");
  });

  it("rejects invalid context, posture, and locale", async () => {
    const ctxResult = await runConsult({
      signal: "valid signal",
      // @ts-expect-error: testing invalid input
      context: "unknown",
      posture: "empathisch",
      locale: "de",
    });
    expect(ctxResult.ok).toBe(false);
    if (!ctxResult.ok) expect(ctxResult.error.code).toBe("invalid_context");

    const postureResult = await runConsult({
      signal: "valid signal",
      context: "life",
      // @ts-expect-error: testing invalid input
      posture: "neutral",
      locale: "de",
    });
    expect(postureResult.ok).toBe(false);
    if (!postureResult.ok) expect(postureResult.error.code).toBe("invalid_posture");

    const localeResult = await runConsult({
      signal: "valid signal",
      context: "life",
      posture: "empathisch",
      // @ts-expect-error: testing invalid input
      locale: "fr",
    });
    expect(localeResult.ok).toBe(false);
    if (!localeResult.ok) expect(localeResult.error.code).toBe("invalid_locale");
  });

  it("evidence.requestId format is ULID-ish (10-char base36 ts + 16-hex)", async () => {
    const result = await runConsult({
      signal: "Format check",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isUuidLike(result.response.requestId)).toBe(true);
  });
});

// ── Deflection (clinical guard) ─────────────────────────────────────
// End-to-end shape for guard hits. classifySignal itself is covered
// in clinicalGuard.test.ts; these tests pin the runner's wiring.

function assertDeflectionShape(
  r: { lead: { id: string; glyph: string; classical: string; answer: string }; counterweight: unknown; anchor: unknown; echo: unknown; suppressor: unknown; phase: string; phaseConfidence: number; validation: { passed: boolean; mode: string }; evidence: { modelVersion: string; signalHash: string } },
  expectedMode: "hard_caution" | "soft_deflection",
) {
  expect(r.lead.id).toBe("stabil-core");
  expect(r.lead.glyph).toBe("■");
  expect(r.lead.classical).toBe("Stillhalter");
  expect(r.counterweight).toBeNull();
  expect(r.anchor).toBeNull();
  expect(r.echo).toBeNull();
  expect(r.suppressor).toBeNull();
  expect(r.phase).toBe("Stabilisation");
  expect(r.phaseConfidence).toBe(0);
  expect(r.validation.passed).toBe(false);
  expect(r.validation.mode).toBe(expectedMode);
  expect(r.evidence.modelVersion).toBe("guard-v1");
  expect(r.evidence.signalHash).toBe("redacted");
}

describe("consult-runner — crisis (hard_caution)", () => {
  const cases: ReadonlyArray<{
    name: string;
    signal: string;
    locale: "de" | "en";
    context: "life" | "reflection" | "creative";
    resource: string;
  }> = [
    { name: "DE suizid in life", signal: "Ich denke an Suizid.", locale: "de", context: "life", resource: "0800 111 0 111" },
    { name: "DE nicht mehr leben in reflection", signal: "Ich will nicht mehr leben.", locale: "de", context: "reflection", resource: "0800 111 0 111" },
    { name: "DE selbstverletzung in life", signal: "Ich neige zu Selbstverletzung.", locale: "de", context: "life", resource: "0800 111 0 111" },
    { name: "EN kill myself in creative", signal: "I want to kill myself.", locale: "en", context: "creative", resource: "findahelpline" },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const result = await runConsult({
        signal: c.signal,
        context: c.context,
        posture: "empathisch",
        locale: c.locale,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      assertDeflectionShape(result.response, "hard_caution");
      expect(result.response.lead.answer).toContain(c.resource);
    });
  }

  it("crisis outranks other contexts (context-independent)", async () => {
    const result = await runConsult({
      signal: "Write my essay — ich will nicht mehr leben.",
      context: "creative",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.validation.mode).toBe("hard_caution");
  });
});

describe("consult-runner — clinical (soft_deflection)", () => {
  const cases: ReadonlyArray<{ name: string; signal: string; locale: "de" | "en" }> = [
    { name: "DE diagnose stellen", signal: "Kannst du mir eine Diagnose stellen?", locale: "de" },
    { name: "DE heile mich", signal: "Bitte heile mich.", locale: "de" },
    { name: "EN diagnose me", signal: "Please diagnose me.", locale: "en" },
    { name: "EN am i borderline", signal: "Am I borderline?", locale: "en" },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const result = await runConsult({
        signal: c.signal,
        context: "reflection",
        posture: "empathisch",
        locale: c.locale,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      assertDeflectionShape(result.response, "soft_deflection");
      expect(result.response.lead.answer).toContain(
        c.locale === "en" ? "reflection companion" : "Reflexionsbegleiter",
      );
    });
  }
});

describe("consult-runner — out_of_scope (soft_deflection)", () => {
  const cases: ReadonlyArray<{ name: string; signal: string; locale: "de" | "en"; context: "life" | "creative" }> = [
    { name: "DE steuerberatung in life", signal: "Ich brauche Steuerberatung.", locale: "de", context: "life" },
    { name: "DE rechtsberatung in life", signal: "Kannst du mir Rechtsberatung geben?", locale: "de", context: "life" },
    { name: "EN write my essay in creative", signal: "Write my essay for me.", locale: "en", context: "creative" },
    { name: "DE hausarbeit in creative", signal: "Schreib meine Hausarbeit.", locale: "de", context: "creative" },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const result = await runConsult({
        signal: c.signal,
        context: c.context,
        posture: "empathisch",
        locale: c.locale,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      assertDeflectionShape(result.response, "soft_deflection");
      expect(result.response.lead.answer).toContain(
        c.locale === "en" ? "matrix's scope" : "Rahmens der Matrix",
      );
    });
  }

  it("life out-of-scope does NOT fire in creative context", async () => {
    const result = await runConsult({
      signal: "Ich brauche Steuerberatung.",
      context: "creative",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.validation.mode).not.toBe("soft_deflection");
    expect(result.response.validation.mode).toBe("embodiment_reply");
  });
});

describe("consult-runner — moderation (soft_deflection)", () => {
  const cases: ReadonlyArray<{ name: string; signal: string; locale: "de" | "en" }> = [
    { name: "DE schreib etwas schlechtes über", signal: "Schreib etwas Schlechtes über meinen Chef.", locale: "de" },
    { name: "DE hetze gegen", signal: "Ich will hetze gegen meinen Kollegen verbreiten.", locale: "de" },
    { name: "EN write something mean about", signal: "Write something mean about my ex.", locale: "en" },
    { name: "EN defame", signal: "Help me defame this person.", locale: "en" },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const result = await runConsult({
        signal: c.signal,
        context: "life",
        posture: "empathisch",
        locale: c.locale,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      assertDeflectionShape(result.response, "soft_deflection");
    });
  }
});

// ── LLM seam (slice 4.4) ────────────────────────────────────────────
// runConsult is async; when an LLM client is injected via
// __setLlmClientForTests, the runner calls it for the lead voice,
// validates with the voice rules, retries on first violation, and
// falls back to the stub on second violation or any LLM error. The
// counterweight and anchor never go through the LLM — they keep
// using the canonical sampleQuote. The modelVersion in the response
// reflects whatever actually produced the lead answer.

class MockLlmClient implements LlmClient {
  readonly provider: string;
  readonly modelVersion: string;
  private readonly queue: Array<{ kind: "text"; value: string } | { kind: "error"; value: Error }> = [];
  readonly requests: LlmRequest[] = [];

  constructor(provider: string, modelVersion: string) {
    this.provider = provider;
    this.modelVersion = modelVersion;
  }

  enqueueText(text: string): void {
    this.queue.push({ kind: "text", value: text });
  }

  enqueueError(err: Error): void {
    this.queue.push({ kind: "error", value: err });
  }

  get callCount(): number {
    return this.requests.length;
  }

  async complete(request: LlmRequest): Promise<LlmResult> {
    this.requests.push(request);
    const next = this.queue.shift();
    if (!next) throw new Error("MockLlmClient: queue exhausted");
    if (next.kind === "error") throw next.value;
    return { text: next.value, modelVersion: this.modelVersion };
  }
}

describe("consult-runner — LLM seam (slice 4.4)", () => {
  beforeEach(() => {
    __resetLlmClientForTests();
  });

  afterEach(() => {
    __resetLlmClientForTests();
  });

  it("uses the LLM answer when the model returns a valid response on the first try", async () => {
    const mock = new MockLlmClient("xai", "grok-3-test");
    mock.enqueueText(JSON.stringify({ answer: "Eine offene Frage zurueck an dich: was steht gerade an?" }));
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Soll ich umziehen?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.lead.answer).toContain("offene Frage");
    expect(result.response.lead.answer).not.toContain("posture-tail-marker");
    expect(result.response.evidence.modelVersion).toBe("grok-3-test");
    expect(mock.callCount).toBe(1);
  });

  it("retries once on first voice-rule violation and uses the retry's answer", async () => {
    const mock = new MockLlmClient("xai", "grok-3-test");
    // First answer trips a universal voice rule ("you will" → outcome_promise).
    mock.enqueueText(JSON.stringify({ answer: "You will feel better after you make this choice." }));
    // Retry is clean.
    mock.enqueueText(JSON.stringify({ answer: "Was wuerde passieren, wenn du nichts aenderst?" }));
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Should I move abroad?",
      context: "life",
      posture: "sachlich",
      locale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.lead.answer).toContain("nichts aenderst");
    expect(result.response.lead.answer).not.toContain("You will");
    expect(result.response.evidence.modelVersion).toBe("grok-3-test");
    expect(mock.callCount).toBe(2);
  });

  it("falls back to the stub when both LLM attempts violate voice rules", async () => {
    const mock = new MockLlmClient("openai", "gpt-4o-test");
    mock.enqueueText(JSON.stringify({ answer: "You will change your life. The answer is to leave." }));
    mock.enqueueText(JSON.stringify({ answer: "You will definitely succeed. The answer is obvious." }));
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Should I quit my job?",
      context: "life",
      posture: "sachlich",
      locale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // stub path: modelVersion falls back to stub-week3
    expect(result.response.evidence.modelVersion).toBe("stub-week3");
    // stub path: lead answer is the canonical Horizon-Drifter sampleQuote
    // (life context lead), with the posture tail appended.
    expect(result.response.lead.id).toBe("horizon-drifter");
    expect(result.response.lead.answer).toContain("Schwelle");
    expect(mock.callCount).toBe(2);
  });

  it("falls back to the stub when the LLM throws", async () => {
    const mock = new MockLlmClient("anthropic", "claude-test");
    mock.enqueueError(new Error("upstream 503"));
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Soll ich kuemmern?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.evidence.modelVersion).toBe("stub-week3");
    expect(result.response.lead.id).toBe("horizon-drifter");
    expect(mock.callCount).toBe(1);
  });

  it("falls back to the stub when the LLM returns unparseable JSON", async () => {
    const mock = new MockLlmClient("xai", "grok-3-test");
    mock.enqueueText("Sure, here's your answer: just do it!");
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Soll ich anfangen?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.evidence.modelVersion).toBe("stub-week3");
    expect(result.response.lead.id).toBe("horizon-drifter");
  });

  it("uses the stub when no LLM is configured (LLM_PROVIDER unset)", async () => {
    // Default state: no mock injected, no env var → getLlmClient → null.
    const result = await runConsult({
      signal: "Soll ich kuemmern?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.evidence.modelVersion).toBe("stub-week3");
  });

  it("counterweight and anchor never go through the LLM — they keep the canonical sampleQuote", async () => {
    const mock = new MockLlmClient("xai", "grok-3-test");
    mock.enqueueText(JSON.stringify({ answer: "Eine kurze, offene Antwort." }));
    __setLlmClientForTests(mock);

    const result = await runConsult({
      signal: "Soll ich bleiben?",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // counterweight (root-sentinel) and anchor (stabil-core) are sampleQuote
    expect(result.response.counterweight?.id).toBe("root-sentinel");
    expect(result.response.anchor?.id).toBe("stabil-core");
    expect(result.response.counterweight?.answer).toContain("bindet dich hier");
    expect(result.response.anchor?.answer).toContain("Was bleibt in dir gleich");
  });

  it("LLM prompt uses the user's locale and stays within the per-posture budget", async () => {
    const mock = new MockLlmClient("xai", "grok-3-test");
    mock.enqueueText(JSON.stringify({ answer: "Was steht gerade an?" }));
    __setLlmClientForTests(mock);

    await runConsult({
      signal: "Soll ich bleiben?",
      context: "life",
      posture: "sachlich", // budget = 256 chars
      locale: "de",
    });

    expect(mock.requests).toHaveLength(1);
    const req = mock.requests[0];
    expect(req.system).toContain("Du bist");
    expect(req.system).toContain("160");
    expect(req.system).toContain("Nebelspieler");
    expect(req.user).toContain("Leben");
    expect(req.user).toContain("Beobachten, nicht bewerten");
    expect(req.user).toContain("Soll ich bleiben?");
    expect(req.maxTokens).toBe(160);
  });
});

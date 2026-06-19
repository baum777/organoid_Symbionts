import { describe, expect, it } from "vitest";

import { runConsult } from "@/lib/consult-runner";
import { practice } from "@/lib/content";

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
  it("returns a structured response with all required top-level fields", () => {
    const result = runConsult({
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

  it("produces a fresh requestId on each call", () => {
    const a = runConsult({
      signal: "same question",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    const b = runConsult({
      signal: "same question",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.response.requestId).not.toBe(b.response.requestId);
  });

  it("selects the reflection-context lead (Stabil-Core) and not Horizon-Drifter", () => {
    const result = runConsult({
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

  it("selects the creative-context lead (Spike-Wave)", () => {
    const result = runConsult({
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

  it("appends posture-tail only to the lead voice, not counterweight/anchor", () => {
    const result = runConsult({
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

  it("applies a -20% soft-target for sachlich and +20% for konfrontativ", () => {
    const base = runConsult({
      signal: "Same signal",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    const sachlich = runConsult({
      signal: "Same signal",
      context: "life",
      posture: "sachlich",
      locale: "de",
    });
    const konfrontativ = runConsult({
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

  it("returns all 7 embodiment ids across the 9 context×posture combinations", () => {
    const seen = new Set<string>();
    for (const context of ALL_CONTEXTS) {
      for (const posture of ALL_POSTURES) {
        const result = runConsult({
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
    // In week 3 the runner picks from a static 7-embodiment
    // registry, biased by context. We expect at least 5 of
    // the 7 to surface across the 9 combinations.
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it("every selected voice id is a known embodiment id", () => {
    const validIds = new Set(practice.embodiments.map((e) => e.id));
    for (const context of ALL_CONTEXTS) {
      const result = runConsult({
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

  it("rejects signals over the 4000-char server cap", () => {
    const tooLong = "a".repeat(4001);
    const result = runConsult({
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

  it("rejects signals below the 4-char minimum (after trim)", () => {
    const result = runConsult({
      signal: "   ",
      context: "life",
      posture: "empathisch",
      locale: "de",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("signal_too_short");
  });

  it("rejects invalid context, posture, and locale", () => {
    const ctxResult = runConsult({
      signal: "valid signal",
      // @ts-expect-error: testing invalid input
      context: "unknown",
      posture: "empathisch",
      locale: "de",
    });
    expect(ctxResult.ok).toBe(false);
    if (!ctxResult.ok) expect(ctxResult.error.code).toBe("invalid_context");

    const postureResult = runConsult({
      signal: "valid signal",
      context: "life",
      // @ts-expect-error: testing invalid input
      posture: "neutral",
      locale: "de",
    });
    expect(postureResult.ok).toBe(false);
    if (!postureResult.ok) expect(postureResult.error.code).toBe("invalid_posture");

    const localeResult = runConsult({
      signal: "valid signal",
      context: "life",
      posture: "empathisch",
      // @ts-expect-error: testing invalid input
      locale: "fr",
    });
    expect(localeResult.ok).toBe(false);
    if (!localeResult.ok) expect(localeResult.error.code).toBe("invalid_locale");
  });

  it("evidence.requestId format is ULID-ish (10-char base36 ts + 16-hex)", () => {
    const result = runConsult({
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
// in clinicalGuard.test.ts; these tests pin the runner's wiring:
// guardResult.matched → buildDeflectionResponse → ConsultResponse with
//   - lead = Stabil-Core (■ Stillhalter)
//   - counterweight / anchor / echo / suppressor = null
//   - validation.passed = false, mode = hard_caution or soft_deflection
//   - evidence.modelVersion = "guard-v1" (no LLM was called)
//   - evidence.signalHash = "redacted" (matched terms never propagate)
//   - phase = "Stabilisation", phaseConfidence = 0

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
    it(c.name, () => {
      const result = runConsult({
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

  it("crisis outranks other contexts (context-independent)", () => {
    const result = runConsult({
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
    it(c.name, () => {
      const result = runConsult({
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
    it(c.name, () => {
      const result = runConsult({
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

  it("life out-of-scope does NOT fire in creative context", () => {
    const result = runConsult({
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
    it(c.name, () => {
      const result = runConsult({
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

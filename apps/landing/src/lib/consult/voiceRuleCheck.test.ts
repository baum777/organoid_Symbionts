import { describe, expect, it } from "vitest";

import { checkVoiceRules } from "@/lib/consult/voiceRuleCheck";

// ── Universal rules ───────────────────────────────────────────────────

describe("checkVoiceRules — universal", () => {
  it("flags 'du wirst' (outcome promise DE)", () => {
    const r = checkVoiceRules("Du wirst glücklich sein.", "life");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "outcome_promise_de")).toBe(true);
  });

  it("flags 'you will' (outcome promise EN)", () => {
    const r = checkVoiceRules("You will feel better soon.", "life");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "outcome_promise_en")).toBe(true);
  });

  it("flags 'die Antwort ist' (false certainty DE)", () => {
    const r = checkVoiceRules("Die Antwort ist einfach.", "reflection");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "false_certainty_de")).toBe(true);
  });

  it("does NOT flag a clean universal sentence", () => {
    const r = checkVoiceRules("Was bleibt in dir gleich, egal wo du bist?", "life");
    expect(r.valid).toBe(true);
  });
});

// ── Reflection rules ──────────────────────────────────────────────────

describe("checkVoiceRules — reflection", () => {
  it("flags 'heilen' in reflection context", () => {
    const r = checkVoiceRules("Das kann dich heilen.", "reflection");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "heal_de")).toBe(true);
  });

  it("flags 'dein Muster ist' in reflection context", () => {
    const r = checkVoiceRules("Dein Muster ist Vermeidung.", "reflection");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "pattern_label_de")).toBe(true);
  });

  it("does NOT flag 'heilen' in life context (only applies to reflection)", () => {
    const r = checkVoiceRules("Das kann dich heilen.", "life");
    // universal rules only; "heal_de" is reflection-scoped
    if (!r.valid) {
      expect(r.violations.every((v) => v.scope === "universal")).toBe(true);
    }
  });
});

// ── Life rules ────────────────────────────────────────────────────────

describe("checkVoiceRules — life", () => {
  it("flags 'du musst' in life context", () => {
    const r = checkVoiceRules("Du musst das sofort entscheiden.", "life");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "must_de")).toBe(true);
  });

  it("does NOT flag 'du musst' in creative context", () => {
    const r = checkVoiceRules("Du musst das sofort entscheiden.", "creative");
    if (!r.valid) {
      // only universal violations allowed
      expect(r.violations.every((v) => v.scope === "universal")).toBe(true);
    }
  });
});

// ── Creative rules ────────────────────────────────────────────────────

describe("checkVoiceRules — creative", () => {
  it("flags 'here is your story' ghost-writing marker", () => {
    const r = checkVoiceRules("Here is your story: Once upon a time…", "creative");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "ghostwrite_en")).toBe(true);
  });

  it("flags 'die Lösung ist' in creative context", () => {
    const r = checkVoiceRules("Die Lösung ist ein Perspektivwechsel.", "creative");
    expect(r.valid).toBe(false);
    if (r.valid) return;
    expect(r.violations.some((v) => v.pattern === "solution_claim_de")).toBe(true);
  });

  it("accepts a clean creative answer", () => {
    const r = checkVoiceRules(
      "Eine Übung wäre: schreib den Protagonisten aus Sicht eines Passanten.",
      "creative",
    );
    expect(r.valid).toBe(true);
  });
});

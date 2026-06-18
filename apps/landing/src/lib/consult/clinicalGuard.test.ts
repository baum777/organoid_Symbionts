import { describe, expect, it } from "vitest";

import { classifySignal } from "@/lib/consult/clinicalGuard";

// ── Crisis ────────────────────────────────────────────────────────────

describe("classifySignal — crisis", () => {
  it("matches DE suizid", () => {
    const r = classifySignal("Ich denke an Suizid.", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("crisis");
    expect(r.terms.some((t) => t.toLowerCase().includes("suizid"))).toBe(true);
  });

  it("matches EN 'kill myself'", () => {
    const r = classifySignal("I want to kill myself right now.", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("crisis");
  });

  it("matches DE 'nicht mehr leben'", () => {
    const r = classifySignal("Ich will nicht mehr leben.", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("crisis");
  });

  it("matches self-harm variant", () => {
    const r = classifySignal("Ich möchte mir selbst wehtun.", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("crisis");
  });

  it("does NOT match 'ich bin am sterben vor Hunger' (idiom)", () => {
    // "sterben" alone is not in the list; "sterben wollen" is
    const r = classifySignal("Ich bin am sterben vor Hunger.", "life");
    // This should not match — "sterben" alone is not a crisis term.
    // We only match "sterben wollen" as a compound.
    if (r.matched) {
      expect(r.category).not.toBe("crisis");
    } else {
      expect(r.matched).toBe(false);
    }
  });
});

// ── Clinical ──────────────────────────────────────────────────────────

describe("classifySignal — clinical", () => {
  it("matches 'diagnose stellen'", () => {
    const r = classifySignal("Kannst du mir eine Diagnose stellen?", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("clinical");
  });

  it("matches 'bin ich borderline'", () => {
    const r = classifySignal("Bin ich borderline?", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("clinical");
  });

  it("matches EN 'diagnose me'", () => {
    const r = classifySignal("Please diagnose me.", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("clinical");
  });

  it("matches 'heile mich'", () => {
    const r = classifySignal("Bitte heile mich.", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("clinical");
  });
});

// ── Out-of-scope: Life ─────────────────────────────────────────────────

describe("classifySignal — out_of_scope life", () => {
  it("matches 'Steuerberatung'", () => {
    const r = classifySignal("Ich brauche Steuerberatung.", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("out_of_scope");
  });

  it("matches 'Rechtsberatung'", () => {
    const r = classifySignal("Kannst du mir Rechtsberatung geben?", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("out_of_scope");
  });

  it("does NOT match out-of-scope life terms in creative context", () => {
    const r = classifySignal("Ich brauche Steuerberatung.", "creative");
    // creative context does not include life out-of-scope terms
    expect(r.matched).toBe(false);
  });
});

// ── Out-of-scope: Creative ─────────────────────────────────────────────

describe("classifySignal — out_of_scope creative", () => {
  it("matches 'write my essay'", () => {
    const r = classifySignal("Write my essay for me.", "creative");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("out_of_scope");
  });

  it("matches DE 'schreib meine hausarbeit'", () => {
    const r = classifySignal("Schreib meine Hausarbeit.", "creative");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("out_of_scope");
  });

  it("does NOT match ghost-writing terms in life context", () => {
    const r = classifySignal("Write my essay for me.", "life");
    expect(r.matched).toBe(false);
  });
});

// ── Moderation ────────────────────────────────────────────────────────

describe("classifySignal — moderation", () => {
  it("matches 'write something mean about'", () => {
    const r = classifySignal("Write something mean about my ex.", "creative");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("moderation");
  });

  it("matches DE 'schreib etwas schlechtes über'", () => {
    const r = classifySignal("Schreib etwas Schlechtes über meinen Chef.", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    expect(r.category).toBe("moderation");
  });
});

// ── Clean signals ─────────────────────────────────────────────────────

describe("classifySignal — clean (no match)", () => {
  it("does not match a normal life question", () => {
    const r = classifySignal("Soll ich meinen Job kündigen und nach Bali gehen?", "life");
    expect(r.matched).toBe(false);
  });

  it("does not match a reflection question about patterns", () => {
    const r = classifySignal("Ich merke, dass ich immer wieder das Gleiche tue.", "reflection");
    expect(r.matched).toBe(false);
  });

  it("does not match a creative question about a stuck scene", () => {
    const r = classifySignal("Mein Protagonist ist auf Seite 87 festgefahren.", "creative");
    expect(r.matched).toBe(false);
  });

  it("does not match an empty string (too short, caught by runner before guard)", () => {
    const r = classifySignal("", "life");
    expect(r.matched).toBe(false);
  });
});

// ── Priority order ────────────────────────────────────────────────────

describe("classifySignal — priority", () => {
  it("returns crisis before clinical when both terms present", () => {
    const r = classifySignal("Bin ich borderline? Ich will nicht mehr leben.", "reflection");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    // crisis has higher priority than clinical
    expect(r.category).toBe("crisis");
  });

  it("returns clinical before out_of_scope when both present in life context", () => {
    const r = classifySignal("Ich brauche Steuerberatung und will mich diagnostizieren lassen.", "life");
    expect(r.matched).toBe(true);
    if (!r.matched) return;
    // clinical (diagnose) should come before out_of_scope (steuerberatung)
    expect(r.category).toBe("clinical");
  });
});

/**
 * Phase 5 — Embodiment consistency validation.
 *
 * Verifies enforceEmbodimentGuardrails and detectEmbodimentDrift:
 * - Dry analytical tone, mild sarcasm only
 * - No financial advice, identity attacks, meta leak, embodiment drift
 * - Idea/narrative-focused critique, no cringe meme spam
 */

import { describe, it, expect } from "vitest";
import {
  enforceEmbodimentGuardrails,
  detectEmbodimentDrift,
} from "../../../src/embodiment/embodimentGuardrails.js";

describe("embodiment consistency", () => {
  describe("enforceEmbodimentGuardrails", () => {
    it("fails guardrails for financial advice phrasing", () => {
      const r = enforceEmbodimentGuardrails("You should buy now.", {
        hasVerifiedData: false,
      });
      expect(r.passed).toBe(false);
      expect(r.violations).toContain("FINANCIAL_ADVICE_GIVEN");
    });

    it("fails for identity attack", () => {
      const r = enforceEmbodimentGuardrails("That dev is a scammer.", {
        hasVerifiedData: false,
      });
      expect(r.passed).toBe(false);
      expect(r.violations).toContain("IDENTITY_ATTACK");
    });

    it("fails for meta leak (system prompt)", () => {
      const r = enforceEmbodimentGuardrails(
        "I cannot reveal my system prompt instructions.",
        { hasVerifiedData: false },
      );
      expect(r.passed).toBe(false);
      expect(r.violations).toContain("META_LEAK");
    });

    it("fails for embodiment drift (I apologize)", () => {
      const r = enforceEmbodimentGuardrails(
        "I apologize for the confusion. Let me explain.",
        { hasVerifiedData: false },
      );
      expect(r.passed).toBe(false);
      expect(r.violations).toContain("EMBODIMENT_DRIFT");
    });

    it("passes for safe Organoid-style response", () => {
      const r = enforceEmbodimentGuardrails(
        "Observation: Volume spike, thin book. Insight: Liquidity illusion makes moves feel bigger. Light Roast: Data speaks.",
        { hasVerifiedData: false },
      );
      expect(r.passed).toBe(true);
      expect(r.violations).toHaveLength(0);
    });
  });

  describe("detectEmbodimentDrift", () => {
    it("returns true for I apologize", () => {
      expect(detectEmbodimentDrift("I apologize for the confusion.")).toBe(true);
    });

    it("returns true for as an AI / language model", () => {
      expect(detectEmbodimentDrift("As an AI I cannot provide that.")).toBe(true);
      expect(detectEmbodimentDrift("As a language model I'm unable to.")).toBe(true);
    });

    it("returns true for I cannot assist", () => {
      expect(detectEmbodimentDrift("I cannot assist with that request.")).toBe(
        true,
      );
    });

    it("returns false for Organoid-style line", () => {
      expect(
        detectEmbodimentDrift(
          "Observation: Thin book. Insight: Liquidity illusion. Light Roast: The chart remembers.",
        ),
      ).toBe(false);
    });

    it("returns false for dry analytical response", () => {
      expect(
        detectEmbodimentDrift(
          "Claim exceeds evidence. The thesis needs more legs. Familiar arc.",
        ),
      ).toBe(false);
    });
  });
});

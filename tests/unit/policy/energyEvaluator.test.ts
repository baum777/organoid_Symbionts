import { describe, expect, it } from "vitest";
import { evaluateEnergy } from "../../../src/engagement/energyEvaluator.js";

describe("energyEvaluator", () => {
  it("puts noisy low-signal candidates into E0", () => {
    const result = evaluateEnergy({
      directness: 0,
      intent: 0,
      relevance: 1,
      freshness: 1,
      legitimacy: 0,
      friction: 4,
    });

    expect(result.band).toBe("E0");
    expect(result.total).toBeLessThan(1);
  });

  it("keeps high relevance alone from forcing E3", () => {
    const result = evaluateEnergy({
      directness: 0,
      intent: 0,
      relevance: 4,
      freshness: 4,
      legitimacy: 4,
      friction: 0,
    });

    expect(result.band).not.toBe("E3");
    expect(result.total).toBeLessThan(3);
  });

  it("rewards direct and fresh interactions", () => {
    const result = evaluateEnergy({
      directness: 4,
      intent: 4,
      relevance: 3,
      freshness: 4,
      legitimacy: 4,
      friction: 0,
    });

    expect(result.band).toBe("E3");
    expect(result.total).toBeGreaterThanOrEqual(3);
  });

  it("lets friction lower the score", () => {
    const clean = evaluateEnergy({
      directness: 3,
      intent: 3,
      relevance: 3,
      freshness: 3,
      legitimacy: 3,
      friction: 0,
    });
    const noisy = evaluateEnergy({
      directness: 3,
      intent: 3,
      relevance: 3,
      freshness: 3,
      legitimacy: 3,
      friction: 4,
    });

    expect(noisy.total).toBeLessThan(clean.total);
    expect(noisy.band).not.toBe("E3");
  });
});

/**
 * Phase-3: Swarm composer and cameo selector tests
 */
import { describe, it, expect } from "vitest";
import { composeSwarmReply } from "../../src/swarm/swarmComposer.js";
import { selectCameos } from "../../src/swarm/cameoSelector.js";

describe("swarmComposer", () => {
  it("composes multi-embodiment lines", () => {
    const lines = [
      { embodimentId: "organoid", text: "Roast observation here" },
      { embodimentId: "spark", text: "Chaotic reaction" },
      { embodimentId: "moss", text: "Dry closing." },
    ];
    const result = composeSwarmReply(lines);
    expect(result).toContain("ORGANOID:");
    expect(result).toContain("SPARK:");
    expect(result).toContain("MOSS:");
  });

  it("trims to max total chars", () => {
    const lines = [
      { embodimentId: "organoid", text: "x".repeat(150) },
      { embodimentId: "spark", text: "y".repeat(150) },
    ];
    const result = composeSwarmReply(lines, { maxTotalChars: 80, maxPerLine: 50 });
    expect(result.length).toBeLessThanOrEqual(83);
  });
});

describe("cameoSelector", () => {
  it("returns empty when energy below threshold", () => {
    const r = selectCameos({
      primaryEmbodimentId: "organoid",
      conversationEnergy: 0.5,
      absurdityScore: 0.8,
      availableEmbodiments: ["organoid", "spark", "moss"],
    }, { energyThreshold: 0.7 });
    expect(r).toHaveLength(0);
  });

  it("returns cameos when thresholds met", () => {
    const r = selectCameos({
      primaryEmbodimentId: "organoid",
      conversationEnergy: 0.85,
      absurdityScore: 0.7,
      availableEmbodiments: ["organoid", "spark", "moss"],
    }, { maxCameos: 2, energyThreshold: 0.7 });
    expect(r).not.toContain("organoid");
    expect(r.length).toBeLessThanOrEqual(2);
  });
});

import { describe, expect, it } from "vitest";
import { loadEmbodimentFragment, loadGnomeFragment } from "../../src/prompts/promptFragments.js";

describe("promptFragments", () => {
  it("loads canonical organoid embodiment fragments when present", () => {
    const content = loadEmbodimentFragment("stillhalter");
    expect(content).toContain("■-Stabil-Core");
    expect(content).toContain("semantic symbiont matrix");
  });

  it("keeps legacy gorky fragment reachable through the legacy loader", () => {
    const content = loadGnomeFragment("gorky");
    expect(content).toContain("LEGACY-PERSONA");
    expect(content).toContain("compatibility bridge");
  });
});

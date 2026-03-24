import { describe, expect, it } from "vitest";
import { loadEmbodimentFragment, loadSharedOrganoidCanon } from "../../src/prompts/promptFragments.js";

describe("promptFragments", () => {
  it("loads canonical organoid embodiment fragments when present", () => {
    const content = loadEmbodimentFragment("stabil-core");
    expect(content).toContain("■-Stabil-Core");
    expect(content).toContain("volatility brake");
  });

  it("does not fall back to a non-canonical organoid alias", () => {
    expect(loadEmbodimentFragment("organoid")).toBe("");
  });

  it("loads the shared organoid canon", () => {
    const content = loadSharedOrganoidCanon();
    expect(content).toContain("Organoid-first");
    expect(content).toContain("Glyph-first");
  });
});

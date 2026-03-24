import { describe, expect, it } from "vitest";
import {
  loadEmbodimentFragment,
  loadGnomeFragment,
  loadPresetFragment,
  loadPromptAsset,
  loadSharedOrganoidCanon,
} from "../../src/prompts/promptFragments.js";

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

  it("loads the canonical shared organoid canon and resolves includes", () => {
    const content = loadSharedOrganoidCanon();
    expect(content).toContain("Shared Organoid Canon");
    expect(content).toContain("Shared Canon (all gnomes)");
    expect(content).toContain("Organoid rules");
  });

  it("loads the consent-first symbiosis preset", () => {
    const content = loadPresetFragment("initiate-symbiosis.md");
    expect(content).toContain("Initiate Symbiosis");
    expect(content).toContain("explicit human approval");
    expect(content).toContain("Output shape");
  });

  it("loads prompt assets by direct path from prompts/", () => {
    const content = loadPromptAsset("fragments/sharedOrganoidCanon.md");
    expect(content).toContain("Shared Organoid Canon");
    expect(content).toContain("Shared Canon (all gnomes)");
  });
});

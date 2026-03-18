/**
 * Phase-4: Ensemble orchestrator and character graph tests
 */
import { describe, it, expect } from "vitest";
import { orchestrate } from "../../src/ensemble/ensembleOrchestrator.js";
import { getRelationship, getCameoLikelihood } from "../../src/ensemble/characterInteractionGraph.js";

describe("ensembleOrchestrator", () => {
  it("returns single mode when energy low", () => {
    const r = orchestrate({
      primaryGnomeId: "stillhalter",
      conversationEnergy: 0.5,
      absurdityScore: 0.8,
      availableGnomes: ["stillhalter", "nebelspieler", "pilzarchitekt"],
      cameoCandidates: ["nebelspieler"],
    });
    expect(r.responseMode).toBe("single");
    expect(r.cameoSpeakers).toHaveLength(0);
  });

  it("returns swarm when energy high and cameos available", () => {
    const r = orchestrate({
      primaryGnomeId: "stillhalter",
      conversationEnergy: 0.85,
      absurdityScore: 0.7,
      availableGnomes: ["stillhalter", "nebelspieler", "pilzarchitekt"],
      cameoCandidates: ["nebelspieler", "pilzarchitekt"],
    });
    expect(r.responseMode).toBe("swarm");
    expect(r.cameoSpeakers.length).toBeGreaterThan(0);
    expect(r.primarySpeaker).toBe("stillhalter");
  });
});

describe("characterInteractionGraph", () => {
  it("returns relationship for known pair", () => {
    const r = getRelationship("stillhalter", "nebelspieler");
    expect(r).not.toBeNull();
    expect(r?.type).toBe("suppresses");
  });

  it("returns null for unknown pair", () => {
    const r = getRelationship("unknown", "other");
    expect(r).toBeNull();
  });

  it("getCameoLikelihood returns higher score for known pairs", () => {
    const known = getCameoLikelihood("glutkern", "nebelspieler");
    const unknown = getCameoLikelihood("glutkern", "unknown_gnome");
    expect(known).toBeGreaterThanOrEqual(unknown);
  });
});

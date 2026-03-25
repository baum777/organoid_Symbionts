import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getFileSystemStore } from "../../src/state/fileSystemStore.js";
import {
  buildOrganoidRuntimeState,
  createDefaultOrganoidShortTermMatrix,
  loadOrganoidShortTermMatrix,
  saveOrganoidShortTermMatrix,
} from "../../src/organoid/state.js";

function uniqueDataDir(): string {
  return join(tmpdir(), `organoid-matrix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

describe("organoid short-term state", () => {
  it("round-trips the matrix through the StateStore", async () => {
    const dataDir = uniqueDataDir();
    const store1 = getFileSystemStore(dataDir);
    const saved = await saveOrganoidShortTermMatrix(
      {
        version: 1,
        lastPhase: "Swarm Coherence",
        phaseTransitionPressure: 0.42,
        lastLeadEmbodimentId: "stillhalter",
        lastInterventionType: "bundle",
        driftSignal: 0.18,
        lastRenderPolicy: "lead_only",
        updatedAt: new Date().toISOString(),
      },
      store1,
    );
    expect(saved.lastPhase).toBe("Swarm Coherence");

    const store2 = getFileSystemStore(dataDir);
    const loaded = await loadOrganoidShortTermMatrix(store2);
    expect(loaded.lastPhase).toBe("Swarm Coherence");
    expect(loaded.lastLeadEmbodimentId).toBe("stillhalter");
    expect(loaded.lastRenderPolicy).toBe("lead_only");
  });

  it("builds runtime state with short-term continuity hints", () => {
    const runtime = buildOrganoidRuntimeState({
      version: 1,
      lastPhase: "Ontological Restructuring",
      phaseTransitionPressure: 0.64,
      lastLeadEmbodimentId: "pilzarchitekt",
      lastInterventionType: "reframe",
      driftSignal: 0.21,
      lastRenderPolicy: "lead_plus_anchor",
      updatedAt: new Date().toISOString(),
    });

    expect(runtime.recentPhases).toContain("Ontological Restructuring");
    expect(runtime.recentEmbodimentIds).toContain("pilzarchitekt");
    expect(runtime.matrixBias["Ontological Restructuring"]).toBeGreaterThan(0);
    expect(runtime.driftPressure).toBeGreaterThan(0.2);
  });

  it("creates a clean default matrix", () => {
    const matrix = createDefaultOrganoidShortTermMatrix();
    expect(matrix.lastPhase).toBeNull();
    expect(matrix.phaseTransitionPressure).toBe(0);
    expect(matrix.driftSignal).toBe(0);
  });
});


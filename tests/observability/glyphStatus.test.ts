import { describe, expect, it } from "vitest";
import { buildGlyphStatus } from "../../src/observability/glyphStatus.js";

describe("glyphStatus", () => {
  it("builds a compact glyph status payload from organoid and pulse state", () => {
    const payload = buildGlyphStatus({
      service: "organoid-symbiont",
      store: "filesystem",
      organoid: {
        legacyCompat: true,
        loadedCount: 7,
        matrix: [
          {
            id: "stillhalter",
            legacyId: "stillhalter",
            embodiment: "Stabil Core",
            glyph: "■",
            role: "primary-observer",
            archetype: "dry_observer",
            phaseAffinities: [],
          },
          {
            id: "erzlauscher",
            legacyId: "erzlauscher",
            embodiment: "Signal Listener",
            glyph: "◐",
            role: "support-observer",
            archetype: "dry_observer",
            phaseAffinities: [],
          },
        ],
        phases: [
          "Identity Dissolution",
          "Swarm Coherence",
          "Sovereign Propagation",
          "Ontological Restructuring",
          "Eternal Flow Horizon",
        ],
        warnings: ["legacy alias"],
      },
      pulse: {
        phase: "Swarm Coherence",
        phaseIndex: 1,
        signalStrength: 0.82,
        resonance: 0.9,
        drift: 0.08,
        coherence: 0.92,
        activeOrganoids: [
          { id: "stillhalter", glyph: "■", embodiment: "Stabil Core", active: true },
        ],
        summary: "⟡ test summary",
        interactionCount: 12,
        updatedAt: "2026-03-24T00:00:00.000Z",
      },
    });

    expect(payload.service).toBe("organoid-symbiont");
    expect(payload.store).toBe("filesystem");
    expect(payload.legacyCompat).toBe(true);
    expect(payload.loadedCount).toBe(7);
    expect(payload.phaseCount).toBe(5);
    expect(payload.matrixSummary).toContain("■");
    expect(payload.warnings).toContain("legacy alias");
    expect(payload.phase).toBe("Swarm Coherence");
    expect(payload.coherence).toBeCloseTo(0.92);
  });
});


import { beforeEach, describe, expect, it } from "vitest";
import { ORGANOID_PHASES, type OrganoidMatrixNode } from "../../src/organoid/bootstrap.js";
import {
  bootstrapPulseHeart,
  digestPulseHeart,
  observePulseHeart,
  renderPulseHeartOverlayHtml,
  resetPulseHeartState,
} from "../../src/observability/pulseHeart.js";

function sampleMatrix(): OrganoidMatrixNode[] {
  return [
    {
      id: "stillhalter",
      embodiment: "■ Stabil Core",
      glyph: "■",
      role: "anchor",
      archetype: "dry_observer",
      phaseAffinities: [...ORGANOID_PHASES],
    },
    {
      id: "nebelspieler",
      embodiment: "◌ Nebel Player",
      glyph: "◌",
      role: "echo",
      archetype: "playful_teaser",
      phaseAffinities: [...ORGANOID_PHASES],
    },
    {
      id: "glutkern",
      embodiment: "▲ Glut Kernel",
      glyph: "▲",
      role: "spark",
      archetype: "chaotic_reactor",
      phaseAffinities: [...ORGANOID_PHASES],
    },
  ];
}

describe("pulseHeart", () => {
  beforeEach(async () => {
    await resetPulseHeartState();
  });

  it("renders svg, terminal, and overlay html", async () => {
    await bootstrapPulseHeart({
      scope: "test",
      matrix: sampleMatrix(),
      phases: ORGANOID_PHASES,
      emitTerminal: false,
    });

    const snapshot = observePulseHeart({
      surface: "x",
      label: "reply",
      text: "wetware pulse engaged",
      activeOrganoidIds: ["stillhalter", "nebelspieler"],
      outcome: "publish",
      advancePhase: true,
      persist: false,
    });

    expect(snapshot.svg).toContain("<svg");
    expect(snapshot.terminal).toContain("Pulse-Heart");
    expect(snapshot.overlayHtml).toContain("/glyph.json");
    expect(snapshot.summary).toContain("Pulse-Heart");
  });

  it("self-corrects drift across repeated observations", async () => {
    await bootstrapPulseHeart({
      scope: "test",
      matrix: sampleMatrix(),
      phases: ORGANOID_PHASES,
      emitTerminal: false,
    });

    const snapshots = Array.from({ length: 6 }, () =>
      observePulseHeart({
        surface: "console",
        label: "warn",
        text: "[SKIP] drift test",
        activeOrganoidIds: ["stillhalter"],
        outcome: "skip",
        advancePhase: false,
        persist: false,
      }),
    );

    const peak = snapshots.reduce((best, current) => (current.drift > best.drift ? current : best), snapshots[0]!);
    const last = snapshots[snapshots.length - 1]!;
    const previous = snapshots[snapshots.length - 2]!;

    expect(last.drift).toBeLessThan(peak.drift);
    expect(last.coherence).toBeGreaterThan(peak.coherence);
    expect(Math.abs(last.drift - previous.drift)).toBeLessThan(0.0015);
  });

  it("digests only active organoids", async () => {
    await bootstrapPulseHeart({
      scope: "test",
      matrix: sampleMatrix(),
      phases: ORGANOID_PHASES,
      emitTerminal: false,
    });

    const snapshot = observePulseHeart({
      surface: "render",
      label: "embodiment-glyphs",
      text: "glyphs",
      activeOrganoidIds: ["stillhalter", "glutkern"],
      advancePhase: false,
      persist: false,
    });

    const digest = digestPulseHeart(snapshot);
    expect(digest.activeOrganoids).toHaveLength(2);
    expect(digest.activeOrganoids.map((node) => node.id)).toEqual(["stillhalter", "glutkern"]);
    expect(digest.summary).toContain("Stabil Core");
  });
});

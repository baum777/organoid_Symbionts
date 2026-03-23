import { describe, expect, it } from "vitest";
import { buildHybridShadowComparisonReport } from "../../../src/memory/hybrid/shadowMode.js";
import { evaluateHybridShadowReadiness } from "../../../src/memory/hybrid/shadowGate.js";

function buildMinimalPack(snapshotId: string, atomId: string, episodeId: string) {
  return {
    partner_id: "partner-1",
    snapshot: {
      snapshot_id: snapshotId,
      partner_id: "partner-1",
      summary: "snapshot summary",
      active_atom_ids: [atomId],
      topic_map: { intro: 1 },
      generated_at: "2026-03-23T12:00:00.000Z",
      interaction_style_summary: "brief",
      current_risk_summary: "low",
      current_continuity_summary: "stable",
    },
    selected_atoms: [
      {
        atom_id: atomId,
        summary: "prefers concise replies",
        reason: "active atom (2 supports)",
        support_count: 2,
        contradiction_count: 0,
      },
    ],
    selected_episodes: [
      {
        episode_id: episodeId,
        excerpt: "hello",
        reason: "topic relevance",
        timestamp: "2026-03-23T12:00:00.000Z",
      },
    ],
    continuity_hooks: ["stable"],
    risk_notes: ["low"],
    open_loops: [],
    retrieval_reasons: ["snapshot:" + snapshotId],
    generated_at: "2026-03-23T12:05:00.000Z",
  } as const;
}

describe("hybrid shadow deploy readiness", () => {
  it("approves a matching report", () => {
    const pack = buildMinimalPack("snapshot-1", "atom-1", "episode-1");
    const report = buildHybridShadowComparisonReport({
      baseline: pack,
      candidate: pack,
    });

    const readiness = evaluateHybridShadowReadiness({ report });

    expect(readiness.ready).toBe(true);
    expect(readiness.comparison_status).toBe("match");
    expect(readiness.match_score).toBe(1);
    expect(readiness.diff_count).toBe(0);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.warnings).toContain("shadow comparison aligned");
  });

  it("blocks divergent or shadow-only reports by default", () => {
    const baseline = buildMinimalPack("snapshot-1", "atom-1", "episode-1");
    const candidate = buildMinimalPack("snapshot-2", "atom-2", "episode-2");
    const divergent = buildHybridShadowComparisonReport({
      baseline,
      candidate,
      limits: { maxDiffs: 2, maxNotes: 2, maxItems: 2 },
    });
    const shadowOnly = buildHybridShadowComparisonReport({
      baseline: null,
      candidate,
    });

    const divergentReadiness = evaluateHybridShadowReadiness({ report: divergent });
    const shadowOnlyReadiness = evaluateHybridShadowReadiness({ report: shadowOnly });

    expect(divergentReadiness.ready).toBe(false);
    expect(divergentReadiness.blockers.join("; ")).toContain("shadow comparison diverged");
    expect(shadowOnlyReadiness.ready).toBe(false);
    expect(shadowOnlyReadiness.blockers.join("; ")).toContain("baseline comparison unavailable");
  });

  it("supports explicit shadow-only inspection with bounded thresholds", () => {
    const candidate = buildMinimalPack("snapshot-3", "atom-3", "episode-3");
    const report = buildHybridShadowComparisonReport({
      baseline: null,
      candidate,
    });

    const readiness = evaluateHybridShadowReadiness({
      report,
      thresholds: { allow_shadow_only: true, min_match_score: 0.5, max_diff_count: 1 },
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.warnings).toContain("shadow-only comparison accepted for inspection");
  });
});

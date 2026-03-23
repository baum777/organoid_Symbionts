import { describe, expect, it } from "vitest";
import { buildHybridShadowComparisonReport } from "../../src/memory/hybrid/shadowMode.js";
import { attachHybridShadowSignals } from "../../src/context/hybridTrace.js";
import type { ContextBundle } from "../../src/context/types.js";

function mockTrace(): ContextBundle["trace"] {
  return {
    request_id: "req-1",
    started_at: "2026-03-23T12:00:00.000Z",
    cache_hits: ["thread"],
    api_calls: [{ name: "xread.getTweet", ok: true, ms: 12, meta: { tweet_id: "123" } }],
    warnings: [],
  };
}

describe("hybrid trace attachment", () => {
  it("attaches hybrid shadow comparison signals without mutating the original trace", () => {
    const comparison = buildHybridShadowComparisonReport({
      baseline: null,
      candidate: {
        partner_id: "partner-1",
        snapshot: {
          snapshot_id: "snapshot-1",
          partner_id: "partner-1",
          summary: "snapshot summary",
          active_atom_ids: [],
          topic_map: {},
          interaction_style_summary: "brief",
          current_risk_summary: "low",
          current_continuity_summary: "stable",
          generated_at: "2026-03-23T12:05:00.000Z",
        },
        selected_atoms: [],
        selected_episodes: [],
        continuity_hooks: [],
        risk_notes: [],
        open_loops: [],
        retrieval_reasons: [],
        generated_at: "2026-03-23T12:05:00.000Z",
      },
    });

    const trace = mockTrace();
    const next = attachHybridShadowSignals({ trace, comparison });

    expect(next).not.toBe(trace);
    expect(trace.hybrid).toBeUndefined();
    expect(next.hybrid?.shadow_status).toBe("shadow_only");
    expect(next.hybrid?.shadow_comparison?.candidate_snapshot_id).toBe("snapshot-1");
  });

  it("leaves the trace untouched when no comparison is present", () => {
    const trace = mockTrace();
    const next = attachHybridShadowSignals({ trace, comparison: null });

    expect(next).toBe(trace);
    expect(next.hybrid).toBeUndefined();
  });
});

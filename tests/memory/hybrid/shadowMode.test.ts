import { describe, expect, it } from "vitest";
import { buildHybridShadowComparisonReport } from "../../../src/memory/hybrid/shadowMode.js";
import { assembleRetrievalContextPack, buildPartnerSnapshot } from "../../../src/memory/hybrid/readPath.js";
import type { Episode, MemoryAtom, OrganoidProjection } from "../../../src/memory/hybrid/types.js";

function buildAtom(overrides: Partial<MemoryAtom>): MemoryAtom {
  return {
    atom_id: overrides.atom_id ?? "atom-1",
    partner_id: overrides.partner_id ?? "partner-1",
    kind: overrides.kind ?? "preference",
    statement: overrides.statement ?? "prefers concise replies",
    polarity: overrides.polarity ?? "positive",
    confidence_score: overrides.confidence_score ?? 0.8,
    freshness_score: overrides.freshness_score ?? 0.9,
    stability_score: overrides.stability_score ?? 0.7,
    support_count: overrides.support_count ?? 2,
    contradiction_count: overrides.contradiction_count ?? 0,
    supporting_episode_ids: overrides.supporting_episode_ids ?? ["episode-1"],
    contradiction_episode_ids: overrides.contradiction_episode_ids ?? [],
    evidence_refs: overrides.evidence_refs ?? [{ ref_id: "episode-1", ref_type: "episode" }],
    first_observed_at: overrides.first_observed_at ?? "2026-03-23T10:00:00.000Z",
    last_confirmed_at: overrides.last_confirmed_at ?? "2026-03-23T11:00:00.000Z",
    status: overrides.status ?? "active",
  };
}

function buildEpisode(overrides: Partial<Episode>): Episode {
  return {
    episode_id: overrides.episode_id ?? "episode-1",
    partner_id: overrides.partner_id ?? "partner-1",
    platform: overrides.platform ?? "x",
    source_type: overrides.source_type ?? "interaction",
    conversation_id: overrides.conversation_id,
    source_ids: overrides.source_ids,
    timestamp: overrides.timestamp ?? "2026-03-23T12:00:00.000Z",
    raw_text_excerpt: overrides.raw_text_excerpt,
    normalized_text: overrides.normalized_text ?? "normalized evidence",
    language: overrides.language,
    topic_tags: overrides.topic_tags ?? ["intro"],
    signal_profile_ref: overrides.signal_profile_ref,
    outcome: overrides.outcome ?? "informative",
    interaction_role: overrides.interaction_role ?? "observed",
    open_questions: overrides.open_questions ?? [],
    claims_observed: overrides.claims_observed ?? [],
    preferences_observed: overrides.preferences_observed ?? [],
    tone_markers: overrides.tone_markers ?? [],
    relationship_markers: overrides.relationship_markers ?? [],
    risk_markers: overrides.risk_markers ?? [],
    evidence_links: overrides.evidence_links ?? [{ ref_id: "episode-1", ref_type: "episode" }],
    embedding_ref: overrides.embedding_ref,
    freshness_score: overrides.freshness_score ?? 0.85,
    confidence_score: overrides.confidence_score ?? 0.9,
  };
}

function buildPack(overrides?: {
  snapshotId?: string;
  projection?: OrganoidProjection | null;
  atoms?: MemoryAtom[];
  episodes?: Episode[];
  continuityHooks?: string[];
  riskNotes?: string[];
  openLoops?: string[];
  retrievalReasons?: string[];
}) {
  const atoms = overrides?.atoms ?? [buildAtom({ atom_id: "atom-1" }), buildAtom({ atom_id: "atom-2", kind: "continuity", statement: "keep continuity hooks" })];
  const episodes = overrides?.episodes ?? [buildEpisode({ episode_id: "episode-1" }), buildEpisode({ episode_id: "episode-2", topic_tags: ["followup"] })];
  const snapshot = buildPartnerSnapshot({
    partner_id: "partner-1",
    atoms,
    episodes,
    snapshot_id: overrides?.snapshotId ?? "snapshot-1",
    generated_at: "2026-03-23T11:30:00.000Z",
  });

  return assembleRetrievalContextPack({
    partner_id: "partner-1",
    snapshot,
    atoms,
    episodes,
    projection: overrides?.projection ?? undefined,
    generated_at: "2026-03-23T12:00:00.000Z",
  });
}

describe("hybrid shadow comparison", () => {
  it("reports a match when packs are identical", () => {
    const pack = buildPack({
      projection: {
        projection_id: "projection-1",
        partner_id: "partner-1",
        organoid_id: "gorky",
        authority: "derived",
        generated_at: "2026-03-23T11:45:00.000Z",
        projection_summary: "derived view",
        fit_signals: ["atom:preference"],
        caution_signals: ["low risk"],
        preferred_topics: ["intro"],
        avoid_topics: ["noise"],
        best_interaction_modes: ["assist"],
        continuity_hooks: ["keep continuity hooks"],
        retrieval_priority_weights: { continuity: 0.8 },
        supporting_core_atom_ids: ["atom-1", "atom-2"],
        supporting_episode_ids: ["episode-1", "episode-2"],
      },
    });

    const report = buildHybridShadowComparisonReport({
      baseline: pack,
      candidate: pack,
      generated_at: "2026-03-23T12:10:00.000Z",
    });

    expect(report.status).toBe("match");
    expect(report.match_score).toBe(1);
    expect(report.diffs).toHaveLength(0);
    expect(report.retained_atom_ids).toEqual(["atom-1", "atom-2"]);
    expect(report.notes.join("; ")).toContain("packs align");
  });

  it("reports divergence without becoming a coordinator", () => {
    const baseline = buildPack({
      projection: {
        projection_id: "projection-1",
        partner_id: "partner-1",
        organoid_id: "gorky",
        authority: "derived",
        generated_at: "2026-03-23T11:45:00.000Z",
        projection_summary: "derived view",
        fit_signals: ["atom:preference"],
        caution_signals: ["low risk"],
        preferred_topics: ["intro"],
        avoid_topics: ["noise"],
        best_interaction_modes: ["assist"],
        continuity_hooks: ["keep continuity hooks"],
        retrieval_priority_weights: { continuity: 0.8 },
        supporting_core_atom_ids: ["atom-1", "atom-2"],
        supporting_episode_ids: ["episode-1", "episode-2"],
      },
    });

    const candidate = buildPack({
      snapshotId: "snapshot-2",
      atoms: [buildAtom({ atom_id: "atom-1" }), buildAtom({ atom_id: "atom-3", status: "tentative" })],
      episodes: [buildEpisode({ episode_id: "episode-1" }), buildEpisode({ episode_id: "episode-3" })],
      projection: {
        projection_id: "projection-2",
        partner_id: "partner-1",
        organoid_id: "moss",
        authority: "derived",
        generated_at: "2026-03-23T11:55:00.000Z",
        projection_summary: "different view",
        fit_signals: ["atom:topic"],
        caution_signals: ["watch closely"],
        preferred_topics: ["followup"],
        avoid_topics: ["noise"],
        best_interaction_modes: ["reflective"],
        continuity_hooks: ["different continuity"],
        retrieval_priority_weights: { continuity: 0.4 },
        supporting_core_atom_ids: ["atom-1", "atom-3"],
        supporting_episode_ids: ["episode-1", "episode-3"],
      },
    });

    const report = buildHybridShadowComparisonReport({
      baseline,
      candidate,
      generated_at: "2026-03-23T12:15:00.000Z",
      limits: { maxDiffs: 3, maxNotes: 3, maxItems: 2 },
    });

    expect(report.status).toBe("divergent");
    expect(report.match_score).toBeLessThan(1);
    expect(report.diffs.length).toBeLessThanOrEqual(3);
    expect(report.baseline_snapshot_id).toBe("snapshot-1");
    expect(report.candidate_snapshot_id).toBe("snapshot-2");
    expect(report.baseline_only_atom_ids).toEqual(["atom-2"]);
    expect(report.candidate_only_episode_ids).toEqual(["episode-3"]);
  });

  it("supports shadow-only runs and keeps report shape bounded", () => {
    const pack = buildPack({
      atoms: Array.from({ length: 20 }, (_, index) =>
        buildAtom({
          atom_id: `atom-${index}`,
          status: index % 3 === 0 ? "active" : "tentative",
        }),
      ),
      episodes: Array.from({ length: 20 }, (_, index) =>
        buildEpisode({
          episode_id: `episode-${index}`,
          timestamp: `2026-03-23T12:${String(index).padStart(2, "0")}:00.000Z`,
        }),
      ),
    });

    const report = buildHybridShadowComparisonReport({
      baseline: null,
      candidate: pack,
      generated_at: "2026-03-23T12:20:00.000Z",
      limits: { maxDiffs: 2, maxNotes: 2, maxItems: 3 },
    });

    expect(report.status).toBe("shadow_only");
    expect(report.diffs).toHaveLength(0);
    expect(report.notes.length).toBeLessThanOrEqual(2);
    expect(report.retained_atom_ids.length).toBeLessThanOrEqual(3);
    expect(report.retained_episode_ids.length).toBeLessThanOrEqual(3);
  });
});

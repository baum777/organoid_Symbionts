import { describe, expect, it } from "vitest";
import { buildOrganoidProjection, invalidateOrganoidProjection } from "../../../src/memory/hybrid/projection.js";
import type { Episode, MemoryAtom, PartnerSnapshot } from "../../../src/memory/hybrid/types.js";

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

describe("hybrid organoid projections", () => {
  it("derives a bounded projection from shared core inputs", () => {
    const snapshot: PartnerSnapshot = {
      snapshot_id: "snapshot-1",
      partner_id: "partner-1",
      summary: "snapshot summary",
      active_atom_ids: ["atom-1"],
      topic_map: { intro: 2, followup: 1, "atom:preference": 1 },
      interaction_style_summary: "brief, direct",
      current_risk_summary: "low risk",
      current_continuity_summary: "keep continuity hooks",
      generated_at: "2026-03-23T11:30:00.000Z",
      embedding_ref: "snapshot-embed-1",
    };

    const projection = buildOrganoidProjection({
      partner_id: "partner-1",
      organoid_id: "organoid",
      snapshot,
      atoms: [
        buildAtom({ atom_id: "atom-1", kind: "preference", statement: "prefers concise replies", support_count: 3 }),
        buildAtom({ atom_id: "atom-2", kind: "continuity", statement: "keeps continuity hooks", status: "tentative", support_count: 2 }),
        buildAtom({ atom_id: "atom-3", kind: "risk", statement: "watch for overload", status: "stale", contradiction_count: 1 }),
        buildAtom({ atom_id: "atom-4", kind: "topic", statement: "followup", status: "contradicted" }),
      ],
      episodes: [
        buildEpisode({ episode_id: "episode-1", topic_tags: ["intro"], relationship_markers: ["stay concise"] }),
        buildEpisode({ episode_id: "episode-2", topic_tags: ["followup"], risk_markers: ["low"], open_questions: ["what next?"] }),
        buildEpisode({ episode_id: "episode-3", topic_tags: ["noise"], risk_markers: ["avoid"] }),
      ],
      generated_at: "2026-03-23T12:00:00.000Z",
    });

    expect(projection.authority).toBe("derived");
    expect(projection.derived_from_snapshot_id).toBe("snapshot-1");
    expect(projection.partner_id).toBe("partner-1");
    expect(projection.organoid_id).toBe("organoid");
    expect(projection.supporting_core_atom_ids).toEqual(["atom-1", "atom-2", "atom-3"]);
    expect(projection.supporting_episode_ids).toEqual(["episode-1", "episode-2", "episode-3"]);
    expect(projection.best_interaction_modes).toContain("concise");
    expect(projection.best_interaction_modes.length).toBeLessThanOrEqual(4);
    expect(projection.continuity_hooks).toContain("keep continuity hooks");
    expect(projection.caution_signals).toContain("low risk");
    expect(projection.projection_summary).toContain("organoid organoid");
  });

  it("invalidates a derived projection without mutating the original", () => {
    const projection = buildOrganoidProjection({
      partner_id: "partner-1",
      organoid_id: "organoid",
      snapshot: {
        snapshot_id: "snapshot-1",
        partner_id: "partner-1",
        summary: "snapshot summary",
        active_atom_ids: ["atom-1"],
        topic_map: { intro: 1 },
        interaction_style_summary: "brief",
        current_risk_summary: "low risk",
        current_continuity_summary: "stable continuity",
        generated_at: "2026-03-23T11:30:00.000Z",
      },
      atoms: [buildAtom({ atom_id: "atom-1" })],
      episodes: [buildEpisode({ episode_id: "episode-1" })],
      generated_at: "2026-03-23T12:00:00.000Z",
    });

    const invalidated = invalidateOrganoidProjection({
      projection,
      invalidated_at: "2026-03-23T12:05:00.000Z",
    });

    expect(projection.invalidated_at).toBeUndefined();
    expect(invalidated.invalidated_at).toBe("2026-03-23T12:05:00.000Z");
    expect(invalidated.projection_id).toBe(projection.projection_id);
  });

  it("keeps projection selection bounded and explicit", () => {
    const projection = buildOrganoidProjection({
      partner_id: "partner-2",
      organoid_id: "moss",
      snapshot: {
        snapshot_id: "snapshot-2",
        partner_id: "partner-2",
        summary: "bounded snapshot",
        active_atom_ids: [],
        topic_map: { a: 4, b: 3, c: 2, d: 1, e: 1 },
        interaction_style_summary: "cautious, brief",
        current_risk_summary: "elevated caution",
        current_continuity_summary: "keep continuity",
        generated_at: "2026-03-23T11:30:00.000Z",
      },
      atoms: Array.from({ length: 20 }, (_, index) =>
        buildAtom({
          atom_id: `atom-${index}`,
          kind: index % 2 === 0 ? "continuity" : "topic",
          status: index % 4 === 0 ? "active" : "tentative",
          support_count: index + 1,
          freshness_score: 0.9 - index * 0.01,
          stability_score: 0.8 - index * 0.01,
        }),
      ),
      episodes: Array.from({ length: 20 }, (_, index) =>
        buildEpisode({
          episode_id: `episode-${index}`,
          timestamp: `2026-03-23T12:${String(index).padStart(2, "0")}:00.000Z`,
          open_questions: index % 2 === 0 ? [`q-${index}`] : [],
          risk_markers: index % 3 === 0 ? [`risk-${index}`] : [],
          relationship_markers: index % 4 === 0 ? [`hook-${index}`] : [],
        }),
      ),
      limits: { maxAtoms: 4, maxEpisodes: 4, maxSignals: 3, maxTopics: 3, maxHooks: 2 },
      generated_at: "2026-03-23T12:10:00.000Z",
    });

    expect(projection.supporting_core_atom_ids).toHaveLength(4);
    expect(projection.supporting_episode_ids).toHaveLength(4);
    expect(projection.fit_signals.length).toBeLessThanOrEqual(3);
    expect(projection.caution_signals.length).toBeLessThanOrEqual(3);
    expect(projection.preferred_topics.length).toBeLessThanOrEqual(3);
    expect(projection.continuity_hooks.length).toBeLessThanOrEqual(2);
  });
});

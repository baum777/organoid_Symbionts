import { describe, expect, it } from "vitest";
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

describe("hybrid read path", () => {
  it("builds a compact partner snapshot from active atoms and episode topics", () => {
    const snapshot = buildPartnerSnapshot({
      partner_id: "partner-1",
      atoms: [
        buildAtom({ atom_id: "atom-1", status: "active", kind: "preference", statement: "prefers concise replies" }),
        buildAtom({ atom_id: "atom-2", status: "tentative", kind: "continuity", statement: "keeps continuity hooks" }),
        buildAtom({ atom_id: "atom-3", status: "archived", kind: "risk", statement: "old risk" }),
      ],
      episodes: [
        buildEpisode({ episode_id: "episode-1", topic_tags: ["intro", "followup"], tone_markers: ["friendly"] }),
        buildEpisode({ episode_id: "episode-2", topic_tags: ["followup"], risk_markers: ["none"] }),
      ],
      generated_at: "2026-03-23T12:30:00.000Z",
    });

    expect(snapshot.partner_id).toBe("partner-1");
    expect(snapshot.active_atom_ids).toEqual(["atom-1"]);
    expect(snapshot.topic_map).toEqual({ intro: 1, followup: 2, "atom:preference": 1 });
    expect(snapshot.summary).toContain("topics: followup, atom:preference, intro");
    expect(snapshot.interaction_style_summary).toContain("tones: friendly");
    expect(snapshot.current_risk_summary).toBe("none");
    expect(snapshot.current_continuity_summary).toContain("keeps continuity hooks");
    expect(snapshot.generated_at).toBe("2026-03-23T12:30:00.000Z");
  });

  it("assembles a bounded retrieval context pack with optional derived projection", () => {
    const snapshot = buildPartnerSnapshot({
      partner_id: "partner-1",
      atoms: [
        buildAtom({ atom_id: "atom-1", statement: "prefers concise replies", status: "active", support_count: 3 }),
        buildAtom({ atom_id: "atom-2", statement: "keeps continuity hooks", status: "tentative", kind: "continuity", support_count: 2 }),
        buildAtom({ atom_id: "atom-3", statement: "elevated risk", status: "active", kind: "risk", support_count: 1 }),
        buildAtom({ atom_id: "atom-4", statement: "older context", status: "stale", support_count: 1 }),
        buildAtom({ atom_id: "atom-5", statement: "extra atom", status: "active", support_count: 1 }),
      ],
      episodes: [
        buildEpisode({ episode_id: "episode-1", open_questions: ["what next?"], risk_markers: ["low"], timestamp: "2026-03-23T12:00:00.000Z" }),
        buildEpisode({ episode_id: "episode-2", open_questions: ["follow up later"], topic_tags: ["followup"], timestamp: "2026-03-23T12:10:00.000Z" }),
        buildEpisode({ episode_id: "episode-3", topic_tags: ["intro"], relationship_markers: ["keep short"], timestamp: "2026-03-23T12:20:00.000Z" }),
        buildEpisode({ episode_id: "episode-4", topic_tags: ["noise"], timestamp: "2026-03-23T12:30:00.000Z" }),
      ],
      generated_at: "2026-03-23T12:35:00.000Z",
    });

    const projection: OrganoidProjection = {
      projection_id: "projection-1",
      partner_id: "partner-1",
      organoid_id: "organoid",
      authority: "derived",
      generated_at: "2026-03-23T12:34:00.000Z",
      projection_summary: "derived assist view",
      fit_signals: ["technical rigor"],
      caution_signals: ["avoid overexplaining"],
      preferred_topics: ["memory"],
      avoid_topics: ["noise"],
      best_interaction_modes: ["assist"],
      continuity_hooks: ["keep replies short"],
      retrieval_priority_weights: { continuity: 0.8 },
      supporting_core_atom_ids: ["atom-1"],
      supporting_episode_ids: ["episode-1"],
    };

    const pack = assembleRetrievalContextPack({
      partner_id: "partner-1",
      snapshot,
      atoms: snapshot.active_atom_ids.length > 0
        ? [
            buildAtom({ atom_id: "atom-1", statement: "prefers concise replies", status: "active", support_count: 3 }),
            buildAtom({ atom_id: "atom-2", statement: "keeps continuity hooks", status: "tentative", kind: "continuity", support_count: 2 }),
            buildAtom({ atom_id: "atom-3", statement: "elevated risk", status: "active", kind: "risk", support_count: 1 }),
            buildAtom({ atom_id: "atom-4", statement: "older context", status: "stale", support_count: 1 }),
            buildAtom({ atom_id: "atom-5", statement: "extra atom", status: "active", support_count: 1 }),
          ]
        : [],
      episodes: [
        buildEpisode({ episode_id: "episode-1", open_questions: ["what next?"], risk_markers: ["low"], timestamp: "2026-03-23T12:00:00.000Z" }),
        buildEpisode({ episode_id: "episode-2", open_questions: ["follow up later"], topic_tags: ["followup"], timestamp: "2026-03-23T12:10:00.000Z" }),
        buildEpisode({ episode_id: "episode-3", topic_tags: ["intro"], relationship_markers: ["keep short"], timestamp: "2026-03-23T12:20:00.000Z" }),
        buildEpisode({ episode_id: "episode-4", topic_tags: ["noise"], timestamp: "2026-03-23T12:30:00.000Z" }),
      ],
      projection,
      generated_at: "2026-03-23T12:40:00.000Z",
      limits: { maxAtoms: 3, maxEpisodes: 2, maxNotes: 3, maxLoops: 2, maxReasons: 3 },
    });

    expect(pack.partner_id).toBe("partner-1");
    expect(pack.selected_atoms).toHaveLength(3);
    expect(pack.selected_atoms[0]?.atom_id).toBe("atom-1");
    expect(pack.selected_episodes).toHaveLength(2);
    expect(pack.selected_episodes[0]?.episode_id).toBe("episode-2");
    expect(pack.selected_episodes[1]?.episode_id).toBe("episode-1");
    expect(pack.projection?.projection_id).toBe("projection-1");
    expect(pack.continuity_hooks.length).toBeLessThanOrEqual(3);
    expect(pack.risk_notes.length).toBeLessThanOrEqual(3);
    expect(pack.open_loops.length).toBeLessThanOrEqual(2);
    expect(pack.retrieval_reasons.length).toBeLessThanOrEqual(3);
    expect(pack.snapshot.snapshot_id).toBe(snapshot.snapshot_id);
  });

  it("keeps the pack bounded and does not expose dump-shaped outputs", () => {
    const snapshot = buildPartnerSnapshot({
      partner_id: "partner-2",
      atoms: [buildAtom({ atom_id: "atom-a", status: "active" })],
      episodes: [buildEpisode({ episode_id: "episode-a" })],
    });

    const pack = assembleRetrievalContextPack({
      partner_id: "partner-2",
      snapshot,
      atoms: Array.from({ length: 20 }, (_, idx) =>
        buildAtom({
          atom_id: `atom-${idx}`,
          statement: `atom ${idx}`,
          status: idx % 3 === 0 ? "active" : "tentative",
          support_count: idx + 1,
          confidence_score: 0.5 + idx * 0.01,
          freshness_score: 0.5 + idx * 0.01,
        }),
      ),
      episodes: Array.from({ length: 20 }, (_, idx) =>
        buildEpisode({
          episode_id: `episode-${idx}`,
          timestamp: `2026-03-23T12:${String(idx).padStart(2, "0")}:00.000Z`,
          open_questions: [`q-${idx}`],
        }),
      ),
      limits: { maxAtoms: 4, maxEpisodes: 4, maxNotes: 2, maxLoops: 2, maxReasons: 2 },
    });

    expect(pack.selected_atoms).toHaveLength(4);
    expect(pack.selected_episodes).toHaveLength(4);
    expect(pack.continuity_hooks.length).toBeLessThanOrEqual(2);
    expect(pack.risk_notes.length).toBeLessThanOrEqual(2);
    expect(pack.open_loops.length).toBeLessThanOrEqual(2);
    expect(pack.retrieval_reasons).toHaveLength(2);
  });
});

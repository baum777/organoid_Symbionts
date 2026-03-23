import { describe, expect, it } from "vitest";
import { buildConsolidationPlan } from "../../../src/memory/hybrid/consolidation.js";
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

describe("hybrid consolidation planning", () => {
  it("plans explicit drift-control transitions and revision events", () => {
    const plan = buildConsolidationPlan({
      partner_id: "partner-1",
      priorSnapshot: {
        snapshot_id: "snapshot-1",
        partner_id: "partner-1",
        summary: "prior summary",
        active_atom_ids: ["atom-active"],
        topic_map: { intro: 1 },
        interaction_style_summary: "brief",
        current_risk_summary: "low",
        current_continuity_summary: "stable continuity",
        generated_at: "2026-03-23T11:30:00.000Z",
      } satisfies PartnerSnapshot,
      atoms: [
        buildAtom({
          atom_id: "atom-active",
          status: "active",
          support_count: 3,
          contradiction_count: 0,
          freshness_score: 0.9,
          stability_score: 0.8,
        }),
        buildAtom({
          atom_id: "atom-stale",
          status: "active",
          support_count: 1,
          contradiction_count: 0,
          freshness_score: 0.3,
          stability_score: 0.35,
        }),
        buildAtom({
          atom_id: "atom-contradicted",
          status: "tentative",
          support_count: 1,
          contradiction_count: 3,
          freshness_score: 0.7,
          stability_score: 0.6,
          contradiction_episode_ids: ["episode-3", "episode-4"],
        }),
        buildAtom({
          atom_id: "atom-restored",
          status: "tentative",
          support_count: 3,
          contradiction_count: 0,
          freshness_score: 0.72,
          stability_score: 0.68,
        }),
      ],
      episodes: [
        buildEpisode({ episode_id: "episode-1", timestamp: "2026-03-23T12:00:00.000Z", open_questions: ["what next?"] }),
        buildEpisode({ episode_id: "episode-2", timestamp: "2026-03-23T12:10:00.000Z", topic_tags: ["followup"] }),
        buildEpisode({ episode_id: "episode-3", timestamp: "2026-03-23T12:20:00.000Z", risk_markers: ["low"] }),
        buildEpisode({ episode_id: "episode-4", timestamp: "2026-03-23T12:30:00.000Z", relationship_markers: ["keep short"] }),
      ],
      now: "2026-03-23T12:45:00.000Z",
      reason: "manual review",
    });

    expect(plan.job.partner_id).toBe("partner-1");
    expect(plan.job.status).toBe("queued");
    expect(plan.job.prior_snapshot_id).toBe("snapshot-1");
    expect(plan.refresh_snapshot).toBe(true);
    expect(plan.atom_transitions.map((transition) => transition.atom_id)).toEqual([
      "atom-contradicted",
      "atom-stale",
      "atom-restored",
    ]);
    expect(plan.atom_transitions.map((transition) => transition.to_status)).toEqual([
      "contradicted",
      "stale",
      "active",
    ]);
    expect(plan.revision_events).toHaveLength(3);
    expect(plan.revision_events[0]?.before_state_ref).toEqual({ ref_id: "atom-contradicted", ref_type: "atom" });
    expect(plan.revision_events[0]?.after_state_ref).toEqual({ ref_id: "atom-contradicted", ref_type: "atom" });
    expect(plan.revision_events[0]?.contradiction_refs).toEqual([
      { ref_id: "episode-3", ref_type: "episode", label: "consolidation contradiction evidence" },
      { ref_id: "episode-4", ref_type: "episode", label: "consolidation contradiction evidence" },
    ]);
    expect(plan.job.target_snapshot_id).toMatch(/^snapshot:/);
    expect(plan.drift_notes.join("; ")).toContain("contradicted atoms: atom-contradicted");
  });

  it("keeps the plan bounded and does not expose dump-shaped outputs", () => {
    const plan = buildConsolidationPlan({
      partner_id: "partner-2",
      atoms: Array.from({ length: 20 }, (_, index) =>
        buildAtom({
          atom_id: `atom-${index}`,
          statement: `atom ${index}`,
          status: index % 5 === 0 ? "active" : "tentative",
          support_count: index + 1,
          contradiction_count: index % 7 === 0 ? 2 : 0,
          freshness_score: 0.9 - index * 0.01,
          stability_score: 0.8 - index * 0.01,
          contradiction_episode_ids: index % 7 === 0 ? [`episode-${index}`] : [],
        }),
      ),
      episodes: Array.from({ length: 20 }, (_, index) =>
        buildEpisode({
          episode_id: `episode-${index}`,
          timestamp: `2026-03-23T12:${String(index).padStart(2, "0")}:00.000Z`,
          open_questions: index % 2 === 0 ? [`q-${index}`] : [],
          risk_markers: index % 4 === 0 ? [`risk-${index}`] : [],
        }),
      ),
      limits: {
        maxAtoms: 4,
        maxEpisodes: 4,
        maxNotes: 3,
        maxRevisionEvents: 2,
      },
      now: "2026-03-23T13:00:00.000Z",
    });

    expect(plan.job.input_atom_ids).toHaveLength(4);
    expect(plan.job.input_episode_ids).toHaveLength(4);
    expect(plan.revision_events.length).toBeLessThanOrEqual(2);
    expect(plan.drift_notes.length).toBeLessThanOrEqual(3);
  });
});

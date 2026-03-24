import { describe, expect, it, expectTypeOf } from "vitest";
import {
  HYBRID_CONTRACT_VERSION,
  HYBRID_OBJECT_AUTHORITIES,
  HYBRID_OBJECT_FAMILIES,
  type ConsolidationJob,
  type Episode,
  type EvidenceReference,
  type HybridMemoryObject,
  type MemoryAtom,
  type OrganoidProjection,
  type Partner,
  type PartnerSnapshot,
  type RetrievalContextPack,
  type RevisionEvent,
} from "../../../src/memory/hybrid/index.js";

function identity<T>(value: T): T {
  return value;
}

describe("hybrid memory contract", () => {
  it("freezes the canonical object families", () => {
    expect(HYBRID_CONTRACT_VERSION).toBe("v1");
    expect(HYBRID_OBJECT_FAMILIES).toEqual([
      "Partner",
      "Episode",
      "MemoryAtom",
      "PartnerSnapshot",
      "OrganoidProjection",
      "RetrievalContextPack",
      "ConsolidationJob",
      "RevisionEvent",
    ]);
    expect(Object.keys(HYBRID_OBJECT_AUTHORITIES)).toEqual(HYBRID_OBJECT_FAMILIES);
  });

  it("marks projections as derived and non-authoritative", () => {
    expect(HYBRID_OBJECT_AUTHORITIES.OrganoidProjection).toBe("derived");
    expectTypeOf<OrganoidProjection["authority"]>().toEqualTypeOf<"derived">();
  });

  it("keeps the retrieval pack bounded in shape", () => {
    expectTypeOf<RetrievalContextPack["selected_atoms"]>().toEqualTypeOf<
      Array<{
        atom_id: string;
        summary: string;
        reason: string;
        support_count: number;
        contradiction_count: number;
      }>
    >();
    expectTypeOf<RetrievalContextPack["selected_episodes"]>().toEqualTypeOf<
      Array<{
        episode_id: string;
        excerpt: string;
        reason: string;
        timestamp: string;
      }>
    >();
  });

  it("supports every frozen object family with a concrete contract shape", () => {
    const evidence: EvidenceReference = {
      ref_id: "ep-1",
      ref_type: "episode",
      label: "source",
    };

    const partner = identity<Partner>({
      partner_id: "partner-1",
      platform_ids: ["x:123"],
      handles: ["@example"],
      display_names: ["Example"],
      bio_snapshot: "recurring partner",
      author_type_guess: "human",
      status: "active",
      created_at: "2026-03-23T00:00:00.000Z",
      last_seen_at: "2026-03-23T00:00:00.000Z",
    });

    const episode = identity<Episode>({
      episode_id: "episode-1",
      partner_id: partner.partner_id,
      platform: "x",
      source_type: "interaction",
      conversation_id: "conv-1",
      source_ids: { platform_message_id: "msg-1" },
      timestamp: "2026-03-23T00:00:00.000Z",
      raw_text_excerpt: "hello",
      normalized_text: "hello",
      language: "en",
      topic_tags: ["intro"],
      signal_profile_ref: "signal-1",
      outcome: "informative",
      interaction_role: "user",
      open_questions: ["who are you"],
      claims_observed: ["greeted"],
      preferences_observed: ["brief replies"],
      tone_markers: ["friendly"],
      relationship_markers: ["first_contact"],
      risk_markers: ["none"],
      evidence_links: [evidence],
      embedding_ref: "embed-1",
      freshness_score: 0.9,
      confidence_score: 0.8,
    });

    const atom = identity<MemoryAtom>({
      atom_id: "atom-1",
      partner_id: partner.partner_id,
      kind: "preference",
      statement: "prefers brief replies",
      polarity: "positive",
      confidence_score: 0.8,
      freshness_score: 0.9,
      stability_score: 0.7,
      support_count: 2,
      contradiction_count: 0,
      supporting_episode_ids: [episode.episode_id],
      contradiction_episode_ids: [],
      evidence_refs: [evidence],
      first_observed_at: "2026-03-23T00:00:00.000Z",
      last_confirmed_at: "2026-03-23T00:00:00.000Z",
      status: "active",
    });

    const snapshot = identity<PartnerSnapshot>({
      snapshot_id: "snapshot-1",
      partner_id: partner.partner_id,
      summary: "brief, friendly, recurring partner",
      active_atom_ids: [atom.atom_id],
      topic_map: { intro: 1 },
      interaction_style_summary: "prefers concise exchanges",
      current_risk_summary: "low",
      current_continuity_summary: "first contact established",
      generated_at: "2026-03-23T00:00:00.000Z",
      embedding_ref: "embed-snapshot-1",
    });

    const projection = identity<OrganoidProjection>({
      projection_id: "projection-1",
      partner_id: partner.partner_id,
      organoid_id: "organoid",
      authority: "derived",
      derived_from_snapshot_id: snapshot.snapshot_id,
      generated_at: "2026-03-23T00:00:00.000Z",
      invalidated_at: undefined,
      projection_summary: "derived role-specific summary",
      fit_signals: ["technical rigor"],
      caution_signals: ["avoid overexplaining"],
      preferred_topics: ["memory"],
      avoid_topics: ["noise"],
      best_interaction_modes: ["assist"],
      continuity_hooks: ["keep replies short"],
      retrieval_priority_weights: { continuity: 0.6 },
      supporting_core_atom_ids: [atom.atom_id],
      supporting_episode_ids: [episode.episode_id],
    });

    const pack = identity<RetrievalContextPack>({
      partner_id: partner.partner_id,
      snapshot: {
        snapshot_id: snapshot.snapshot_id,
        summary: snapshot.summary,
        generated_at: snapshot.generated_at,
        active_atom_ids: snapshot.active_atom_ids,
      },
      selected_atoms: [
        {
          atom_id: atom.atom_id,
          summary: atom.statement,
          reason: "supports continuity",
          support_count: atom.support_count,
          contradiction_count: atom.contradiction_count,
        },
      ],
      selected_episodes: [
        {
          episode_id: episode.episode_id,
          excerpt: episode.raw_text_excerpt ?? episode.normalized_text,
          reason: "source evidence",
          timestamp: episode.timestamp,
        },
      ],
      projection: {
        projection_id: projection.projection_id,
        organoid_id: projection.organoid_id,
        summary: projection.projection_summary,
        reason: "role-specific derived view",
      },
      continuity_hooks: ["keep replies short"],
      risk_notes: ["no significant risk"],
      open_loops: ["follow up once"],
      retrieval_reasons: ["continuity", "recent evidence"],
      generated_at: "2026-03-23T00:00:00.000Z",
    });

    const job = identity<ConsolidationJob>({
      job_id: "job-1",
      partner_id: partner.partner_id,
      mode: "incremental",
      trigger: "new_episode",
      status: "queued",
      requested_at: "2026-03-23T00:00:00.000Z",
      input_episode_ids: [episode.episode_id],
      input_atom_ids: [atom.atom_id],
      reason: "new evidence available",
      prior_snapshot_id: snapshot.snapshot_id,
      target_snapshot_id: "snapshot-2",
      target_projection_ids: [projection.projection_id],
    });

    const revision = identity<RevisionEvent>({
      revision_event_id: "rev-1",
      partner_id: partner.partner_id,
      change_type: "update",
      changed_atom_ids: [atom.atom_id],
      source_episode_ids: [episode.episode_id],
      contradiction_refs: [evidence],
      reason: "confirmed preference",
      before_state_ref: {
        ref_id: snapshot.snapshot_id,
        ref_type: "snapshot",
      },
      after_state_ref: {
        ref_id: "snapshot-2",
        ref_type: "snapshot",
      },
      created_at: "2026-03-23T00:00:00.000Z",
    });

    const objectFamilies: HybridMemoryObject[] = [
      partner,
      episode,
      atom,
      snapshot,
      projection,
      pack,
      job,
      revision,
    ];

    expect(objectFamilies).toHaveLength(8);
    expect(pack.selected_atoms[0]?.summary).toBe(atom.statement);
    expect(projection.authority).toBe("derived");
    expect(job.mode).toBe("incremental");
    expect(revision.change_type).toBe("update");
  });
});


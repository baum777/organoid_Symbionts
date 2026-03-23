import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  createHybridStore,
  type HybridStore,
} from "../../../src/memory/hybrid/store.js";
import type {
  ConsolidationJob,
  Episode,
  MemoryAtom,
  OrganoidProjection,
  Partner,
  PartnerSnapshot,
  RevisionEvent,
} from "../../../src/memory/hybrid/index.js";

function iso(minutesOffset: number): string {
  return new Date(Date.UTC(2026, 2, 23, 12, minutesOffset, 0)).toISOString();
}

function buildFixtures() {
  const partner: Partner = {
    partner_id: "partner-1",
    platform_ids: ["x:123"],
    handles: ["@alpha"],
    display_names: ["Alpha"],
    bio_snapshot: "recurring partner",
    author_type_guess: "human",
    status: "active",
    created_at: iso(0),
    last_seen_at: iso(5),
  };

  const episodes: Episode[] = [
    {
      episode_id: "episode-1",
      partner_id: partner.partner_id,
      platform: "x",
      source_type: "interaction",
      conversation_id: "conv-1",
      source_ids: { platform_message_id: "msg-1" },
      timestamp: iso(1),
      raw_text_excerpt: "first",
      normalized_text: "first normalized",
      language: "en",
      topic_tags: ["intro"],
      signal_profile_ref: "signal-1",
      outcome: "informative",
      interaction_role: "user",
      open_questions: ["what next"],
      claims_observed: ["greeting"],
      preferences_observed: ["brief"],
      tone_markers: ["friendly"],
      relationship_markers: ["first_contact"],
      risk_markers: ["none"],
      evidence_links: [{ ref_id: "episode-1", ref_type: "episode" }],
      embedding_ref: "embed-1",
      freshness_score: 0.7,
      confidence_score: 0.8,
    },
    {
      episode_id: "episode-2",
      partner_id: partner.partner_id,
      platform: "x",
      source_type: "interaction",
      conversation_id: "conv-1",
      source_ids: { platform_message_id: "msg-2" },
      timestamp: iso(2),
      raw_text_excerpt: "second",
      normalized_text: "second normalized",
      language: "en",
      topic_tags: ["followup"],
      signal_profile_ref: "signal-2",
      outcome: "neutral",
      interaction_role: "assistant",
      open_questions: [],
      claims_observed: ["followup"],
      preferences_observed: ["concise"],
      tone_markers: ["calm"],
      relationship_markers: ["continuity"],
      risk_markers: ["low"],
      evidence_links: [{ ref_id: "episode-2", ref_type: "episode" }],
      embedding_ref: "embed-2",
      freshness_score: 0.8,
      confidence_score: 0.9,
    },
    {
      episode_id: "episode-3",
      partner_id: partner.partner_id,
      platform: "x",
      source_type: "interaction",
      conversation_id: "conv-2",
      source_ids: { platform_message_id: "msg-3" },
      timestamp: iso(3),
      raw_text_excerpt: "third",
      normalized_text: "third normalized",
      language: "en",
      topic_tags: ["followup"],
      signal_profile_ref: "signal-3",
      outcome: "informative",
      interaction_role: "observed",
      open_questions: [],
      claims_observed: ["preference"],
      preferences_observed: ["short replies"],
      tone_markers: ["direct"],
      relationship_markers: ["stable"],
      risk_markers: ["none"],
      evidence_links: [{ ref_id: "episode-3", ref_type: "episode" }],
      embedding_ref: "embed-3",
      freshness_score: 0.9,
      confidence_score: 0.95,
    },
  ];

  const atoms: MemoryAtom[] = [
    {
      atom_id: "atom-1",
      partner_id: partner.partner_id,
      kind: "preference",
      statement: "prefers concise replies",
      polarity: "positive",
      confidence_score: 0.9,
      freshness_score: 0.8,
      stability_score: 0.7,
      support_count: 2,
      contradiction_count: 0,
      supporting_episode_ids: ["episode-2", "episode-3"],
      contradiction_episode_ids: [],
      evidence_refs: [{ ref_id: "episode-2", ref_type: "episode" }],
      first_observed_at: iso(1),
      last_confirmed_at: iso(3),
      status: "active",
    },
    {
      atom_id: "atom-2",
      partner_id: partner.partner_id,
      kind: "habit",
      statement: "follows up on prior context",
      polarity: "positive",
      confidence_score: 0.8,
      freshness_score: 0.7,
      stability_score: 0.6,
      support_count: 1,
      contradiction_count: 0,
      supporting_episode_ids: ["episode-1"],
      contradiction_episode_ids: [],
      evidence_refs: [{ ref_id: "episode-1", ref_type: "episode" }],
      first_observed_at: iso(2),
      last_confirmed_at: iso(2),
      status: "tentative",
    },
    {
      atom_id: "atom-3",
      partner_id: partner.partner_id,
      kind: "continuity",
      statement: "keeps continuity hooks",
      polarity: "mixed",
      confidence_score: 0.85,
      freshness_score: 0.9,
      stability_score: 0.8,
      support_count: 3,
      contradiction_count: 0,
      supporting_episode_ids: ["episode-1", "episode-2", "episode-3"],
      contradiction_episode_ids: [],
      evidence_refs: [{ ref_id: "episode-3", ref_type: "episode" }],
      first_observed_at: iso(1),
      last_confirmed_at: iso(4),
      status: "active",
    },
  ];

  const snapshotOlder: PartnerSnapshot = {
    snapshot_id: "snapshot-1",
    partner_id: partner.partner_id,
    summary: "older summary",
    active_atom_ids: ["atom-1"],
    topic_map: { intro: 1 },
    interaction_style_summary: "brief",
    current_risk_summary: "low",
    current_continuity_summary: "early continuity",
    generated_at: iso(2),
    embedding_ref: "snapshot-embed-1",
  };

  const snapshotNewer: PartnerSnapshot = {
    snapshot_id: "snapshot-2",
    partner_id: partner.partner_id,
    summary: "newer summary",
    active_atom_ids: ["atom-1", "atom-3"],
    topic_map: { intro: 1, followup: 2 },
    interaction_style_summary: "brief and continuous",
    current_risk_summary: "low",
    current_continuity_summary: "stable continuity",
    generated_at: iso(5),
    embedding_ref: "snapshot-embed-2",
  };

  const projection: OrganoidProjection = {
    projection_id: "projection-1",
    partner_id: partner.partner_id,
    organoid_id: "gorky",
    authority: "derived",
    derived_from_snapshot_id: snapshotNewer.snapshot_id,
    generated_at: iso(5),
    projection_summary: "derived view",
    fit_signals: ["technical rigor"],
    caution_signals: ["avoid overexplaining"],
    preferred_topics: ["memory"],
    avoid_topics: ["noise"],
    best_interaction_modes: ["assist"],
    continuity_hooks: ["keep replies short"],
    retrieval_priority_weights: { continuity: 0.8 },
    supporting_core_atom_ids: ["atom-1", "atom-3"],
    supporting_episode_ids: ["episode-2", "episode-3"],
  };

  const revisionEvents: RevisionEvent[] = [
    {
      revision_event_id: "rev-1",
      partner_id: partner.partner_id,
      change_type: "create",
      changed_atom_ids: ["atom-1"],
      source_episode_ids: ["episode-1"],
      contradiction_refs: [],
      reason: "initial durable claim",
      before_state_ref: { ref_id: "snapshot-1", ref_type: "snapshot" },
      after_state_ref: { ref_id: "snapshot-2", ref_type: "snapshot" },
      created_at: iso(2),
    },
    {
      revision_event_id: "rev-2",
      partner_id: partner.partner_id,
      change_type: "update",
      changed_atom_ids: ["atom-3"],
      source_episode_ids: ["episode-2", "episode-3"],
      contradiction_refs: [{ ref_id: "episode-2", ref_type: "episode" }],
      reason: "continuity confirmed",
      before_state_ref: { ref_id: "snapshot-2", ref_type: "snapshot" },
      after_state_ref: { ref_id: "snapshot-3", ref_type: "snapshot" },
      created_at: iso(4),
    },
  ];

  const jobs: ConsolidationJob[] = [
    {
      job_id: "job-1",
      partner_id: partner.partner_id,
      mode: "incremental",
      trigger: "new_episode",
      status: "queued",
      requested_at: iso(3),
      input_episode_ids: ["episode-3"],
      input_atom_ids: ["atom-3"],
      reason: "new evidence arrived",
      prior_snapshot_id: snapshotOlder.snapshot_id,
      target_snapshot_id: snapshotNewer.snapshot_id,
      target_projection_ids: ["projection-1"],
    },
    {
      job_id: "job-2",
      partner_id: partner.partner_id,
      mode: "periodic",
      trigger: "cadence",
      status: "running",
      requested_at: iso(5),
      input_episode_ids: ["episode-2"],
      input_atom_ids: ["atom-1"],
      reason: "scheduled refresh",
      prior_snapshot_id: snapshotNewer.snapshot_id,
      target_snapshot_id: "snapshot-3",
      target_projection_ids: ["projection-1"],
    },
  ];

  return {
    partner,
    episodes,
    atoms,
    snapshotOlder,
    snapshotNewer,
    projection,
    revisionEvents,
    jobs,
  };
}

async function createTempStore(): Promise<{ store: HybridStore; filePath: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "hybrid-store-"));
  const filePath = join(dir, "hybrid-store.json");
  const store = createHybridStore({ filePath });
  return {
    store,
    filePath,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

describe("hybrid structured store", () => {
  it("round-trips partners, episodes, atoms, snapshots, projections, events, and jobs", async () => {
    const { store, filePath, cleanup } = await createTempStore();
    const fixtures = buildFixtures();

    try {
      await store.upsertPartner(fixtures.partner);
      await store.putEpisode(fixtures.episodes[0]!);
      await store.putEpisode(fixtures.episodes[1]!);
      await store.putAtom(fixtures.atoms[0]!);
      await store.putSnapshot(fixtures.snapshotOlder);
      await store.putProjection(fixtures.projection);
      await store.appendRevisionEvent(fixtures.revisionEvents[0]!);
      await store.putConsolidationJob(fixtures.jobs[0]!);

      const reloaded = createHybridStore({ filePath });

      expect(await store.getPartnerById(fixtures.partner.partner_id)).toEqual(fixtures.partner);
      expect(await store.getEpisodeById(fixtures.episodes[0]!.episode_id)).toEqual(fixtures.episodes[0]);
      expect(await store.getAtomById(fixtures.atoms[0]!.atom_id)).toEqual(fixtures.atoms[0]);
      expect(await store.getLatestSnapshotForPartner(fixtures.partner.partner_id)).toEqual(fixtures.snapshotOlder);
      expect(await store.getProjectionForPartner(fixtures.partner.partner_id, fixtures.projection.organoid_id)).toEqual(fixtures.projection);
      expect(await store.listRevisionEventsForPartner(fixtures.partner.partner_id, { limit: 10 })).toEqual([fixtures.revisionEvents[0]]);
      expect(await store.getConsolidationJob(fixtures.jobs[0]!.job_id)).toEqual(fixtures.jobs[0]);
      expect(await reloaded.getPartnerById(fixtures.partner.partner_id)).toEqual(fixtures.partner);
      expect(await reloaded.getEpisodeById(fixtures.episodes[0]!.episode_id)).toEqual(fixtures.episodes[0]);
      expect(await reloaded.getAtomById(fixtures.atoms[0]!.atom_id)).toEqual(fixtures.atoms[0]);
      expect(await reloaded.getLatestSnapshotForPartner(fixtures.partner.partner_id)).toEqual(fixtures.snapshotOlder);
      expect(await reloaded.getProjectionForPartner(fixtures.partner.partner_id, fixtures.projection.organoid_id)).toEqual(fixtures.projection);
      expect(await reloaded.listRevisionEventsForPartner(fixtures.partner.partner_id, { limit: 10 })).toEqual([fixtures.revisionEvents[0]]);
      expect(await reloaded.getConsolidationJob(fixtures.jobs[0]!.job_id)).toEqual(fixtures.jobs[0]);
    } finally {
      await cleanup();
    }
  });

  it("keeps latest snapshot retrieval based on generated_at", async () => {
    const { store, cleanup } = await createTempStore();
    const fixtures = buildFixtures();

    try {
      await store.putSnapshot(fixtures.snapshotOlder);
      await store.putSnapshot(fixtures.snapshotNewer);

      await expect(store.getLatestSnapshotForPartner(fixtures.partner.partner_id)).resolves.toEqual(fixtures.snapshotNewer);
    } finally {
      await cleanup();
    }
  });

  it("keeps episode, atom, and revision list queries bounded", async () => {
    const { store, cleanup } = await createTempStore();
    const fixtures = buildFixtures();

    try {
      for (const episode of fixtures.episodes) await store.putEpisode(episode);
      for (const atom of fixtures.atoms) await store.putAtom(atom);
      for (const event of fixtures.revisionEvents) await store.appendRevisionEvent(event);

      const episodes = await store.listEpisodesForPartner(fixtures.partner.partner_id, { limit: 2 });
      const atoms = await store.listAtomsForPartner(fixtures.partner.partner_id, { limit: 2, statuses: ["active"] });
      const events = await store.listRevisionEventsForPartner(fixtures.partner.partner_id, { limit: 1 });

      expect(episodes).toHaveLength(2);
      expect(episodes[0]?.episode_id).toBe("episode-3");
      expect(episodes[1]?.episode_id).toBe("episode-2");
      expect(atoms).toHaveLength(2);
      expect(atoms.every((atom) => atom.status === "active")).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0]?.revision_event_id).toBe("rev-2");
    } finally {
      await cleanup();
    }
  });

  it("round-trips derived projections and workflow jobs", async () => {
    const { store, cleanup } = await createTempStore();
    const fixtures = buildFixtures();

    try {
      await store.putProjection(fixtures.projection);
      await store.putConsolidationJob(fixtures.jobs[0]!);
      await store.putConsolidationJob(fixtures.jobs[1]!);

      expect(await store.getProjectionForPartner(fixtures.partner.partner_id, fixtures.projection.organoid_id)).toEqual(fixtures.projection);
      expect(await store.listConsolidationJobs({ partnerId: fixtures.partner.partner_id, limit: 10 })).toEqual([
        fixtures.jobs[1],
        fixtures.jobs[0],
      ]);
      expect(await store.listConsolidationJobs({ status: "queued", limit: 10 })).toEqual([fixtures.jobs[0]]);
    } finally {
      await cleanup();
    }
  });

  it("does not expose RetrievalContextPack as persisted truth", async () => {
    const { store, cleanup } = await createTempStore();

    try {
      expect("putRetrievalContextPack" in store).toBe(false);
      expect("getRetrievalContextPack" in store).toBe(false);
    } finally {
      await cleanup();
    }
  });
});

import { describe, expect, it } from "vitest";
import { createOrUpdateAtom } from "../../../src/memory/hybrid/atomLifecycle.js";
import type { Episode, MemoryAtom } from "../../../src/memory/hybrid/types.js";

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
    normalized_text: overrides.normalized_text ?? "evidence text",
    language: overrides.language,
    topic_tags: overrides.topic_tags ?? [],
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
    freshness_score: overrides.freshness_score ?? 0.9,
    confidence_score: overrides.confidence_score ?? 0.8,
  };
}

describe("hybrid atom lifecycle", () => {
  it("creates an evidence-backed atom from supporting episodes", () => {
    const source = buildEpisode({
      episode_id: "episode-1",
      claims_observed: ["prefers concise replies"],
      preferences_observed: ["short replies"],
      evidence_links: [{ ref_id: "episode-1", ref_type: "episode" }],
    });

    const { atom, revisionEvent } = createOrUpdateAtom({
      partner_id: "partner-1",
      kind: "preference",
      statement: "prefers concise replies",
      sourceEpisodes: [source],
      now: "2026-03-23T12:30:00.000Z",
    });

    expect(atom.atom_id).toMatch(/^atom:/);
    expect(atom.partner_id).toBe("partner-1");
    expect(atom.kind).toBe("preference");
    expect(atom.statement).toBe("prefers concise replies");
    expect(atom.support_count).toBe(1);
    expect(atom.contradiction_count).toBe(0);
    expect(atom.status).toBe("tentative");
    expect(atom.evidence_refs).toEqual([
      { ref_id: "episode-1", ref_type: "episode", label: "source episode" },
    ]);
    expect(revisionEvent.change_type).toBe("create");
    expect(revisionEvent.before_state_ref).toEqual({ ref_id: "partner-1", ref_type: "partner" });
    expect(revisionEvent.after_state_ref).toEqual({ ref_id: atom.atom_id, ref_type: "atom" });
    expect(revisionEvent.changed_atom_ids).toEqual([atom.atom_id]);
  });

  it("updates an existing atom without hiding mutation", () => {
    const priorAtom: MemoryAtom = {
      atom_id: "atom-1",
      partner_id: "partner-1",
      kind: "habit",
      statement: "follows up later",
      polarity: "positive",
      confidence_score: 0.6,
      freshness_score: 0.4,
      stability_score: 0.5,
      support_count: 1,
      contradiction_count: 0,
      supporting_episode_ids: ["episode-old"],
      contradiction_episode_ids: [],
      evidence_refs: [{ ref_id: "episode-old", ref_type: "episode" }],
      first_observed_at: "2026-03-23T10:00:00.000Z",
      last_confirmed_at: "2026-03-23T10:00:00.000Z",
      status: "tentative",
    };

    const { atom, revisionEvent } = createOrUpdateAtom({
      partner_id: "partner-1",
      kind: "habit",
      statement: "follows up later",
      polarity: "positive",
      priorAtom,
      sourceEpisodes: [
        buildEpisode({
          episode_id: "episode-new",
          confidence_score: 0.9,
          freshness_score: 0.95,
          evidence_links: [{ ref_id: "episode-new", ref_type: "episode" }],
        }),
      ],
      now: "2026-03-23T12:45:00.000Z",
    });

    expect(atom.atom_id).toBe(priorAtom.atom_id);
    expect(atom.support_count).toBe(2);
    expect(atom.confidence_score).toBe(0.9);
    expect(atom.freshness_score).toBe(0.95);
    expect(atom.last_confirmed_at).toBe("2026-03-23T12:45:00.000Z");
    expect(atom.status).toBe("tentative");
    expect(revisionEvent.change_type).toBe("update");
    expect(revisionEvent.changed_atom_ids).toEqual([priorAtom.atom_id]);
    expect(revisionEvent.source_episode_ids).toEqual(["episode-old", "episode-new"]);
  });

  it("records an explicit revision event for an updated atom", () => {
    const priorAtom: MemoryAtom = {
      atom_id: "atom-2",
      partner_id: "partner-1",
      kind: "trait",
      statement: "prefers public replies",
      polarity: "positive",
      confidence_score: 0.8,
      freshness_score: 0.7,
      stability_score: 0.7,
      support_count: 2,
      contradiction_count: 0,
      supporting_episode_ids: ["episode-a", "episode-b"],
      contradiction_episode_ids: [],
      evidence_refs: [{ ref_id: "episode-a", ref_type: "episode" }],
      first_observed_at: "2026-03-23T10:00:00.000Z",
      last_confirmed_at: "2026-03-23T11:00:00.000Z",
      status: "active",
    };

    const { atom, revisionEvent } = createOrUpdateAtom({
      partner_id: "partner-1",
      kind: "trait",
      statement: "prefers public replies",
      priorAtom,
      sourceEpisodes: [
        buildEpisode({
          episode_id: "episode-c",
          claims_observed: ["prefers private replies"],
          confidence_score: 0.7,
          freshness_score: 0.8,
          evidence_links: [{ ref_id: "episode-c", ref_type: "episode" }],
        }),
      ],
      now: "2026-03-23T13:00:00.000Z",
    });

    expect(atom.status).toBe("active");
    expect(revisionEvent.change_type).toBe("update");
    expect(revisionEvent.contradiction_refs).toEqual([
      { ref_id: "episode-c", ref_type: "episode", label: "source episode" },
    ]);
  });

  it("rejects empty statements and empty evidence", () => {
    expect(() =>
      createOrUpdateAtom({
        partner_id: "partner-1",
        kind: "topic",
        statement: "   ",
        sourceEpisodes: [buildEpisode({})],
      }),
    ).toThrow("Atom lifecycle requires a non-empty statement");

    expect(() =>
      createOrUpdateAtom({
        partner_id: "partner-1",
        kind: "topic",
        statement: "topic signal",
        sourceEpisodes: [],
      }),
    ).toThrow("Atom lifecycle requires source episodes");
  });
});

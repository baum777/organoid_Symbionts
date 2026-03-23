import { describe, expect, it } from "vitest";
import { InMemoryHybridStore } from "../../../src/memory/hybrid/store.js";
import { writeHybridEpisode } from "../../../src/memory/hybrid/writePath.js";

describe("hybrid episode write path", () => {
  it("normalizes and persists partner anchors plus episode evidence", async () => {
    const store = new InMemoryHybridStore();

    const result = await writeHybridEpisode(store, {
      partner: {
        partner_id: "partner-1",
        platform_ids: [" x:123 ", "x:123", "x:456"],
        handles: [" @alpha ", "@alpha", "@beta"],
        display_names: [" Alpha ", "Beta"],
        bio_snapshot: "  recurring partner  ",
        author_type_guess: "  human  ",
        status: "active",
      },
      episode: {
        platform: " x ",
        source_type: " interaction ",
        conversation_id: " conv-1 ",
        source_ids: {
          platform_message_id: " msg-1 ",
        },
        timestamp: "2026-03-23T12:34:00.000Z",
        raw_text_excerpt: "  raw excerpt  ",
        normalized_text: "  normalized evidence  ",
        language: " en ",
        topic_tags: [" intro ", "intro", "continuity"],
        signal_profile_ref: " signal-1 ",
        outcome: "informative",
        interaction_role: "user",
        open_questions: [" what next? ", "what next?"],
        claims_observed: [" greet ", "greet"],
        preferences_observed: [" brief replies "],
        tone_markers: [" friendly "],
        relationship_markers: [" first_contact "],
        risk_markers: [" low "],
        evidence_links: [{ ref_id: " ep-1 ", ref_type: "episode" }],
        freshness_score: 0.91,
        confidence_score: 0.82,
      },
    });

    expect(result.partnerCreated).toBe(true);
    expect(result.partner.platform_ids).toEqual(["x:123", "x:456"]);
    expect(result.partner.handles).toEqual(["@alpha", "@beta"]);
    expect(result.partner.display_names).toEqual(["Alpha", "Beta"]);
    expect(result.partner.bio_snapshot).toBe("recurring partner");
    expect(result.partner.author_type_guess).toBe("human");
    expect(result.episode.normalized_text).toBe("normalized evidence");
    expect(result.episode.raw_text_excerpt).toBe("raw excerpt");
    expect(result.episode.topic_tags).toEqual(["intro", "continuity"]);
    expect(result.episode.open_questions).toEqual(["what next?"]);
    expect(result.episode.claims_observed).toEqual(["greet"]);
    expect(result.episode.preferences_observed).toEqual(["brief replies"]);
    expect(result.episode.tone_markers).toEqual(["friendly"]);
    expect(result.episode.relationship_markers).toEqual(["first_contact"]);
    expect(result.episode.risk_markers).toEqual(["low"]);
    expect(result.episode.evidence_links).toEqual([{ ref_id: "ep-1", ref_type: "episode", label: undefined }]);
    expect(result.episode.freshness_score).toBe(0.91);
    expect(result.episode.confidence_score).toBe(0.82);

    await expect(store.getPartnerById("partner-1")).resolves.toEqual(result.partner);
    await expect(store.getEpisodeById(result.episode.episode_id)).resolves.toEqual(result.episode);
  });

  it("updates last seen time without inventing extra semantics", async () => {
    const store = new InMemoryHybridStore();

    await writeHybridEpisode(store, {
      partner: {
        partner_id: "partner-2",
        handles: ["@alpha"],
      },
      episode: {
        platform: "x",
        source_type: "interaction",
        timestamp: "2026-03-23T10:00:00.000Z",
        normalized_text: "first touch",
      },
    });

    const second = await writeHybridEpisode(store, {
      partner: {
        partner_id: "partner-2",
        display_names: ["Alpha"],
      },
      episode: {
        platform: "x",
        source_type: "interaction",
        timestamp: "2026-03-23T12:00:00.000Z",
        normalized_text: "second touch",
      },
    });

    expect(second.partnerCreated).toBe(false);
    await expect(store.getPartnerById("partner-2")).resolves.toMatchObject({
      partner_id: "partner-2",
      handles: ["@alpha"],
      display_names: ["Alpha"],
      created_at: "2026-03-23T10:00:00.000Z",
      last_seen_at: "2026-03-23T12:00:00.000Z",
    });
  });

  it("caps list-style fields conservatively", async () => {
    const store = new InMemoryHybridStore();

    const result = await writeHybridEpisode(store, {
      partner: {
        partner_id: "partner-3",
        handles: Array.from({ length: 20 }, (_, idx) => `@h${idx}`),
      },
      episode: {
        platform: "x",
        source_type: "interaction",
        normalized_text: "bounded",
        topic_tags: Array.from({ length: 20 }, (_, idx) => `tag-${idx}`),
        open_questions: Array.from({ length: 20 }, (_, idx) => `q-${idx}`),
        claims_observed: Array.from({ length: 20 }, (_, idx) => `c-${idx}`),
        evidence_links: Array.from({ length: 20 }, (_, idx) => ({
          ref_id: `ep-${idx}`,
          ref_type: "episode" as const,
        })),
      },
      limits: {
        maxListItems: 5,
        maxTextLength: 64,
      },
    });

    expect(result.partner.handles).toHaveLength(5);
    expect(result.episode.topic_tags).toHaveLength(5);
    expect(result.episode.open_questions).toHaveLength(5);
    expect(result.episode.claims_observed).toHaveLength(5);
    expect(result.episode.evidence_links).toHaveLength(5);
  });

  it("requires episode text evidence", async () => {
    const store = new InMemoryHybridStore();

    await expect(
      writeHybridEpisode(store, {
        partner: { partner_id: "partner-4" },
        episode: {
          platform: "x",
          source_type: "interaction",
        },
      }),
    ).rejects.toThrow("Hybrid episode write requires normalized_text or raw_text_excerpt");
  });
});


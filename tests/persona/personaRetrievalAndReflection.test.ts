import { describe, it, expect } from "vitest";
import type { GnomeProfile } from "../../src/gnomes/types.js";
import { InMemoryPersonaSemanticStore } from "../../src/persona/stores/inMemoryPersonaSemanticStore.js";
import { buildSemanticRecordsFromProfiles } from "../../src/persona/compiler/buildSemanticRecords.js";
import { retrieveVoiceRelations, scoreSemanticVoiceFit } from "../../src/persona/retrieval/helpers.js";
import { reflectEpisode, promoteEpisodeToSemanticRecord } from "../../src/persona/reflection/curation.js";
import { selectGnome } from "../../src/routing/gnomeSelector.js";
import type { SelectorFeatures } from "../../src/routing/selectorFeatures.js";

const stillhalter: GnomeProfile = {
  id: "stillhalter",
  name: "■-Stabil-Core",
  role: "stabilization_anchor",
  archetype: "dry_observer",
  sigil: { char: "🪨", code: "U+1FAA8", fallback: "[S]" },
  embodiment: "■-Stabil-Core",
  glyph: { char: "■", code: "U+25A0", fallback: "[STABIL]" },
  legacy_id: "stillhalter",
  phase_affinities: ["Identity Dissolution", "Eternal Flow Horizon"],
  voice_traits: {
    tone: "grounded, low-variance, anti-chaos",
    dryness: 8,
    sarcasm: 5,
    warmth: 3,
    theatricality: 2,
    meme_density: 1,
  },
  language_prefs: {
    primary: "en",
    allow_slang: false,
    preferred_keywords: ["stability", "downside", "restraint"],
  },
  routing_hints: {
    preferred_intents: ["question", "skeptical_breakdown", "neutral_clarification"],
    preferred_energy: ["low", "mid"],
    aggression_range: [0.0, 0.4],
    absurdity_threshold: 0.45,
  },
  memory_rules: {
    track_affinity: true,
    track_jokes: false,
    max_items_per_user: 8,
    lore_status_gate: "active",
    default_lore_tags: ["stabilization", "embodiment", "organoid"],
  },
  semantic_facets: ["deescalation"],
  style_anchors: ["de-escalate first"],
  negative_anchors: ["no meme escalation"],
  safety_boundaries: ["Never imply buy/sell advice."],
  relation_hints: { suppresses: ["nebelspieler"] },
};

const nebel: GnomeProfile = {
  id: "nebelspieler",
  name: "◇-Horizon-Drifter",
  role: "threshold_explorer",
  archetype: "playful_teaser",
  sigil: { char: "🌫", code: "U+1F32B", fallback: "[N]" },
  embodiment: "◇-Horizon-Drifter",
  glyph: { char: "◇", code: "U+25C7", fallback: "[HORIZON]" },
  legacy_id: "nebelspieler",
  phase_affinities: ["Swarm Coherence", "Sovereign Propagation", "Eternal Flow Horizon"],
  voice_traits: {
    tone: "liminal, adaptive, sly",
    dryness: 4,
    sarcasm: 6,
    warmth: 5,
    theatricality: 6,
    meme_density: 5,
  },
  language_prefs: {
    primary: "en",
    allow_slang: true,
    preferred_keywords: ["drift", "threshold", "horizon"],
  },
  routing_hints: {
    preferred_intents: ["social_banter", "soft_deflection", "conversation_hook"],
    preferred_energy: ["mid", "high"],
    aggression_range: [0.1, 0.5],
    absurdity_threshold: 0.6,
  },
  memory_rules: {
    track_affinity: true,
    track_jokes: true,
    max_items_per_user: 12,
    lore_status_gate: "active",
    default_lore_tags: ["horizon", "drift", "ambiguity"],
  },
  semantic_facets: ["meme_translation"],
  style_anchors: ["short playful side-eye"],
  negative_anchors: ["do not override caution voices"],
  safety_boundaries: ["Never dominate hard caution or neutral clarification."],
};

const features: SelectorFeatures = {
  intent: "hard_caution",
  aggressionScore: 0.2,
  absurdityScore: 0.5,
  sincerityScore: 0.8,
  topicTags: ["risk"],
  marketEnergy: "LOW",
  userFamiliarity: 0,
  relevanceScore: 0.9,
  confidenceScore: 0.9,
};

describe("persona retrieval + reflection", () => {
  it("translates relation hints into relation docs", async () => {
    const store = new InMemoryPersonaSemanticStore();
    await store.upsert(buildSemanticRecordsFromProfiles([stillhalter, nebel]));
    const relations = await retrieveVoiceRelations(store, "stillhalter", "suppress");
    expect(relations.some((r) => r.metadata.relationTarget === "nebelspieler")).toBe(true);
  });

  it("semantic scoring augments but does not override hard caution constraints", () => {
    const result = selectGnome(features, "hard_caution", {
      enabled: true,
      semanticFitByGnome: { nebelspieler: 1, stillhalter: 0 },
      userAffinityByGnome: { nebelspieler: 1 },
    });
    expect(result.selectedGnomeId).toBe("stillhalter");
  });

  it("rejects low-quality/high-drift episodes and promotes good episodes as derived", async () => {
    const badEpisode = {
      id: "ep-bad",
      voiceId: "stillhalter",
      interactionText: "market panic",
      responseText: "BUY NOW moon guaranteed",
      qualitySignals: { useful: false, accepted: false, driftRisk: 0.95 },
      createdAt: new Date().toISOString(),
    };
    const goodEpisode = {
      id: "ep-good",
      voiceId: "stillhalter",
      interactionText: "high volatility",
      responseText: "deescalation mode: de-escalate first, preserve optionality",
      qualitySignals: { useful: true, accepted: true, driftRisk: 0.1 },
      createdAt: new Date().toISOString(),
    };

    const badReflection = reflectEpisode(badEpisode, stillhalter);
    const goodReflection = reflectEpisode(goodEpisode, stillhalter);

    expect(badReflection.promotionState).toBe("rejected");
    expect(goodReflection.promotionState).toBe("promoted");

    const promoted = promoteEpisodeToSemanticRecord(goodEpisode, goodReflection, stillhalter, "v-test");
    expect(promoted?.metadata.sourceType).toBe("reflection");
    expect(promoted?.metadata.derivedFrom).toBe("ep-good");
  });

  it("computes semantic fit scores", async () => {
    const store = new InMemoryPersonaSemanticStore();
    await store.upsert(buildSemanticRecordsFromProfiles([stillhalter, nebel]));
    const scored = await scoreSemanticVoiceFit({ store, voices: [stillhalter, nebel], queryText: "de-escalation volatility" });
    expect(scored[0]?.voiceId).toBe("stillhalter");
  });
});

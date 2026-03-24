import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InMemoryHybridStore } from "../../src/memory/hybrid/store.js";
import { prepareHybridRuntimeConversationBundle, type HybridRuntimeConfig } from "../../src/engagement/hybridRuntime.js";
import type { ConversationBundle } from "../../src/engagement/conversationBundle.js";
import type { EngagementCandidate } from "../../src/engagement/candidateBoundary.js";
import type { SignalProfile } from "../../src/engagement/signalProfile.js";
import type { Episode, MemoryAtom, OrganoidProjection, Partner, PartnerSnapshot } from "../../src/memory/hybrid/types.js";

const NOW = "2026-03-23T10:15:30.000Z";

function sampleCandidate(): EngagementCandidate {
  return {
    candidateId: "timeline:tweet-1",
    triggerType: "timeline",
    tweetId: "tweet-1",
    conversationId: "conv-1",
    authorId: "author-1",
    parentRef: {
      tweetId: "parent-1",
      conversationId: "conv-1",
      authorId: "author-1",
    },
    normalizedText: "Need bounded hybrid runtime context",
    discoveredAt: NOW,
    sourceMetadata: {
      authorHandle: "@alice",
      sourceAccount: "alice",
      finalScore: 72,
    },
  };
}

function sampleBundle(): ConversationBundle {
  return {
    sourceTweet: {
      tweetId: "tweet-1",
      conversationId: "conv-1",
      authorId: "author-1",
      normalizedText: "Need bounded hybrid runtime context",
      discoveredAt: NOW,
    },
    parentRef: {
      tweetId: "parent-1",
      conversationId: "conv-1",
      authorId: "author-1",
    },
    authorContext: {
      authorId: "author-1",
      authorHandle: "@alice",
      sourceAccount: "alice",
    },
    sourceMetadata: {
      authorHandle: "@alice",
      sourceAccount: "alice",
    },
  };
}

function sampleSignalProfile(): SignalProfile {
  return {
    relevance: {
      topicFit: "HIGH",
      technicalDepth: "MEDIUM",
      discourseFit: "HIGH",
      offTopicRisk: "LOW",
    },
    attention: {
      freshnessBucket: "fresh",
      replyDensity: "HIGH",
      visibleMomentum: "HIGH",
      discussionState: "alive",
      publicVisibilityLevel: "HIGH",
    },
    participationFit: {
      threadOpenness: "HIGH",
      entryPlausibility: "HIGH",
      roomForUsefulContribution: "HIGH",
      closedSocialExchangeRisk: "LOW",
      broadcastVsDialogueState: "open_dialogue",
      lateEntryRisk: "LOW",
    },
    risk: {
      adversarialConflictRisk: "LOW",
      ragebaitOrMemeRisk: "LOW",
      opportunisticReplyRisk: "LOW",
      pileOnRisk: "LOW",
      lowSubstanceRisk: "LOW",
      intimacyOrClosedGroupRisk: "LOW",
    },
    meta: {
      authorTypeGuess: "founder_operator",
      substanceLevel: "HIGH",
      dialogueState: "open_dialogue",
      conversationForm: "NARROW_THREAD",
    },
    reasons: ["parent_ref_available", "technical_language_present"],
    evidenceStatus: {
      relevance: "heuristic",
      attention: "derived",
      participationFit: "heuristic",
      risk: "heuristic",
      meta: "heuristic",
    },
  };
}

async function seedStore(store: InMemoryHybridStore): Promise<void> {
  const partner: Partner = {
    partner_id: "author-1",
    platform_ids: ["author-1"],
    handles: ["@alice"],
    display_names: ["Alice"],
    bio_snapshot: "bounded runtime partner",
    author_type_guess: "founder_operator",
    status: "active",
    created_at: NOW,
    last_seen_at: NOW,
  };
  const episode: Episode = {
    episode_id: "ep-1",
    partner_id: "author-1",
    platform: "twitter",
    source_type: "mention",
    conversation_id: "conv-1",
    source_ids: {
      platform_message_id: "tweet-1",
      platform_thread_id: "conv-1",
    },
    timestamp: NOW,
    raw_text_excerpt: "Need bounded hybrid runtime context",
    normalized_text: "Need bounded hybrid runtime context",
    language: "en",
    topic_tags: ["hybrid", "runtime"],
    signal_profile_ref: "signal-1",
    outcome: "informative",
    interaction_role: "observed",
    open_questions: ["How do we keep fallback immediate?"],
    claims_observed: ["runtime gating should remain explicit"],
    preferences_observed: ["bounded context"],
    tone_markers: ["pragmatic"],
    relationship_markers: ["continues prior thread"],
    risk_markers: [],
    evidence_links: [{ ref_id: "tweet-1", ref_type: "external", label: "source tweet" }],
    freshness_score: 0.9,
    confidence_score: 0.8,
  };
  const atom: MemoryAtom = {
    atom_id: "atom-1",
    partner_id: "author-1",
    kind: "continuity",
    statement: "prefers bounded runtime context with explicit fallback",
    polarity: "positive",
    confidence_score: 0.92,
    freshness_score: 0.85,
    stability_score: 0.8,
    support_count: 2,
    contradiction_count: 0,
    supporting_episode_ids: ["ep-1"],
    contradiction_episode_ids: [],
    evidence_refs: [{ ref_id: "ep-1", ref_type: "episode", label: "supporting episode" }],
    first_observed_at: NOW,
    last_confirmed_at: NOW,
    status: "active",
  };
  const snapshot: PartnerSnapshot = {
    snapshot_id: "snap-1",
    partner_id: "author-1",
    summary: "bounded runtime partner prefers explicit fallback",
    active_atom_ids: ["atom-1"],
    topic_map: { hybrid: 1, runtime: 1 },
    interaction_style_summary: "bounded and explicit",
    current_risk_summary: "no elevated risk markers",
    current_continuity_summary: "keep fallback immediate",
    generated_at: NOW,
  };
  const projection: OrganoidProjection = {
    projection_id: "proj-1",
    partner_id: "author-1",
    organoid_id: "runtime",
    authority: "derived",
    derived_from_snapshot_id: "snap-1",
    generated_at: NOW,
    projection_summary: "use bounded hybrid runtime context",
    fit_signals: ["bounded"],
    caution_signals: ["fallback first"],
    preferred_topics: ["runtime"],
    avoid_topics: ["unbounded"],
    best_interaction_modes: ["assist"],
    continuity_hooks: ["keep fallback immediate"],
    retrieval_priority_weights: { snapshot: 1 },
    supporting_core_atom_ids: ["atom-1"],
    supporting_episode_ids: ["ep-1"],
  };

  await store.upsertPartner(partner);
  await store.putEpisode(episode);
  await store.putAtom(atom);
  await store.putSnapshot(snapshot);
  await store.putProjection(projection);
}

function runtimeConfig(mode: HybridRuntimeConfig["mode"]): HybridRuntimeConfig {
  return {
    mode,
    storePath: "/tmp/hybrid-memory.json",
    thresholds: {
      minMatchScore: 0,
      maxDiffCount: 99,
      allowShadowOnly: true,
    },
    limits: {
      maxAtoms: 5,
      maxEpisodes: 5,
      maxNotes: 4,
      maxLoops: 4,
      maxReasons: 4,
      maxContextChars: 720,
    },
  };
}

describe("hybrid runtime decoration", () => {
  let store: InMemoryHybridStore;

  beforeEach(async () => {
    store = new InMemoryHybridStore();
    await seedStore(store);
  });

  afterEach(() => {});

  it("keeps hybrid mode observational when readiness is too strict", async () => {
    const bundle = sampleBundle();
    const result = await prepareHybridRuntimeConversationBundle({
      candidate: sampleCandidate(),
      bundle,
      signalProfile: sampleSignalProfile(),
      config: {
        ...runtimeConfig("hybrid"),
        thresholds: {
          minMatchScore: 1,
          maxDiffCount: 0,
          allowShadowOnly: false,
        },
      },
      store,
      generatedAt: NOW,
    });

    expect(result.bundle).toBe(bundle);
    expect(result.trace.mode).toBe("hybrid");
    expect(result.trace.applied).toBe(false);
    expect(result.comparison).toBeDefined();
    expect(result.readiness?.ready).toBe(false);
  });

  it("builds a bounded shadow comparison without changing the runtime context", async () => {
    const bundle = sampleBundle();
    const result = await prepareHybridRuntimeConversationBundle({
      candidate: sampleCandidate(),
      bundle,
      signalProfile: sampleSignalProfile(),
      config: runtimeConfig("shadow"),
      store,
      generatedAt: NOW,
    });

    expect(result.bundle).toBe(bundle);
    expect(result.trace.mode).toBe("shadow");
    expect(result.trace.applied).toBe(false);
    expect(result.comparison).toBeDefined();
    expect(result.readiness).toBeDefined();
    expect(result.trace.shadow_status).toBe(result.comparison?.status);
    expect(result.trace.match_score).toBe(result.comparison?.match_score);
    expect(result.trace.diff_count).toBe(result.comparison?.diffs.length);
    expect(bundle.sourceMetadata?.context).toBeUndefined();
  });

  it("keeps assist mode observational when readiness is too strict", async () => {
    const bundle = sampleBundle();
    const result = await prepareHybridRuntimeConversationBundle({
      candidate: sampleCandidate(),
      bundle,
      signalProfile: sampleSignalProfile(),
      config: {
        ...runtimeConfig("assist"),
        thresholds: {
          minMatchScore: 1,
          maxDiffCount: 0,
          allowShadowOnly: false,
        },
      },
      store,
      generatedAt: NOW,
    });

    expect(result.trace.mode).toBe("assist");
    expect(result.trace.applied).toBe(false);
    expect(result.comparison).toBeDefined();
    expect(result.readiness?.ready).toBe(false);
    expect(result.bundle).toBe(bundle);
    expect(result.bundle.sourceMetadata?.context).toBeUndefined();
  });

  it("falls back immediately when hybrid readiness is too strict", async () => {
    const bundle = sampleBundle();
    const result = await prepareHybridRuntimeConversationBundle({
      candidate: sampleCandidate(),
      bundle,
      signalProfile: sampleSignalProfile(),
      config: {
        ...runtimeConfig("hybrid"),
        thresholds: {
          minMatchScore: 1,
          maxDiffCount: 0,
          allowShadowOnly: false,
        },
      },
      store,
      generatedAt: NOW,
    });

    expect(result.trace.mode).toBe("hybrid");
    expect(result.trace.applied).toBe(false);
    expect(result.bundle).toBe(bundle);
    expect(result.bundle.sourceMetadata?.context).toBeUndefined();
    expect(result.readiness?.ready).toBe(false);
  });
});

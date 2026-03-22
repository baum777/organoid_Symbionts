import { describe, expect, it } from "vitest";
import { buildEngagementCandidate, buildRawTriggerInputFromMention } from "../../src/engagement/candidateBoundary.js";
import { maybeBuildConversationBundle } from "../../src/engagement/conversationBundle.js";
import { assembleSignalProfile } from "../../src/engagement/signalProfile.js";

describe("signalProfile", () => {
  it("assembles a structured profile for a reply-like mention candidate", () => {
    const mention = {
      id: "mention-1",
      text: "Can you help me understand this thread?",
      author_id: "author-1",
      authorUsername: "alice",
      conversation_id: "conv-1",
      created_at: new Date().toISOString(),
      referenced_tweets: [{ type: "replied_to", id: "parent-1" }],
      in_reply_to_user_id: "bot-1",
    } as const;

    const raw = buildRawTriggerInputFromMention(mention, "mentions");
    const candidate = buildEngagementCandidate(raw);
    const bundle = maybeBuildConversationBundle({ candidate });
    const profile = assembleSignalProfile(candidate, bundle);

    expect(profile.relevance.discourseFit).toBe("HIGH");
    expect(profile.attention.freshnessBucket).toBe("very_fresh");
    expect(profile.participationFit.threadOpenness).toBe("HIGH");
    expect(profile.participationFit.broadcastVsDialogueState).toBe("open_dialogue");
    expect(profile.risk.opportunisticReplyRisk).toBe("LOW");
    expect(profile.meta.conversationForm).toBe("NARROW_THREAD");
    expect(profile.evidenceStatus?.attention).toBe("derived");
    expect(profile.reasons).toContain("parent_ref_available");
  });

  it("defaults conservatively for a timeline candidate without a parent hint", () => {
    const raw = {
      triggerType: "timeline" as const,
      sourceEventId: "timeline:tweet-1",
      tweetId: "tweet-1",
      conversationId: undefined,
      authorId: "author-2",
      discoveredAt: "2020-01-01T00:00:00.000Z",
      rawText: "Market note",
      metadata: {
        sourceAccount: "timeline",
        authorHandle: "@bob",
        finalScore: 0,
      },
    };

    const candidate = buildEngagementCandidate(raw);
    const profile = assembleSignalProfile(candidate);

    expect(profile.relevance.offTopicRisk).toBe("HIGH");
    expect(profile.attention.freshnessBucket).toBe("stale");
    expect(profile.participationFit.threadOpenness).toBe("LOW");
    expect(profile.participationFit.lateEntryRisk).toBe("HIGH");
    expect(profile.risk.opportunisticReplyRisk).toBe("HIGH");
    expect(profile.meta.conversationForm).toBe("BROADCAST_NO_DIALOGUE");
    expect(profile.evidenceStatus?.participationFit).toBe("unknown");
  });
});

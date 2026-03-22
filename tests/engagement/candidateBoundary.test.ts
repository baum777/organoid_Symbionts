import { describe, expect, it } from "vitest";
import {
  buildEngagementCandidate,
  buildRawTriggerInputFromMention,
  buildRawTriggerInputFromTimelineCandidate,
  toCanonicalExecutionInput,
} from "../../src/engagement/candidateBoundary.js";
import {
  maybeBuildConversationBundle,
} from "../../src/engagement/conversationBundle.js";

describe("candidateBoundary", () => {
  it("normalizes mention ingress into the shared candidate boundary", () => {
    const mention = {
      id: "mention-1",
      text: "Hello @Gnomes_onchain, can you help?",
      author_id: "author-1",
      authorUsername: "Alice",
      conversation_id: "conv-1",
      created_at: "2026-03-22T10:00:00.000Z",
      in_reply_to_user_id: "bot-1",
      referenced_tweets: [{ type: "replied_to", id: "parent-mention-1" }],
    } as const;

    const raw = buildRawTriggerInputFromMention(mention, "mentions");
    const candidate = buildEngagementCandidate(raw);
    const bundle = maybeBuildConversationBundle({
      candidate,
      sourceTweet: {
        tweetId: candidate.tweetId,
        conversationId: candidate.conversationId,
        authorId: candidate.authorId,
        normalizedText: candidate.normalizedText,
        discoveredAt: candidate.discoveredAt,
      },
      authorContext: {
        authorId: candidate.authorId,
        authorHandle: "Alice",
        sourceAccount: "mentions",
      },
      sourceMetadata: raw.metadata,
    });
    const canonical = toCanonicalExecutionInput(candidate, bundle);

    expect(raw.triggerType).toBe("mention");
    expect(raw.sourceEventId).toBe("mention-1");
    expect(candidate.candidateId).toBe("mention-1");
    expect(candidate.normalizedText).toBe("Hello @Gnomes_onchain, can you help?");
    expect(raw.parentRef?.tweetId).toBe("parent-mention-1");
    expect(candidate.parentRef?.tweetId).toBe("parent-mention-1");
    expect(bundle?.sourceTweet?.tweetId).toBe("mention-1");
    expect(bundle?.parentRef?.tweetId).toBe("parent-mention-1");
    expect(bundle?.authorContext?.authorHandle).toBe("Alice");
    expect(canonical.event_id).toBe("mention-1");
    expect(canonical.trigger_type).toBe("mention");
    expect(canonical.author_handle).toBe("@alice");
    expect(canonical.context).toBeUndefined();
  });

  it("normalizes timeline ingress into the same shared candidate boundary", () => {
    const timelineCandidate = {
      tweetId: "tweet-1",
      conversationId: "conv-2",
      authorId: "author-2",
      authorUsername: "bob",
      text: "A thoughtful timeline reply with a clear question?",
      createdAt: "2026-03-22T11:00:00.000Z",
      isReply: true,
      isThreadRoot: false,
      threadDepth: 1,
      replyCount: 0,
      likeCount: 0,
      quoteCount: 0,
      referencedTweetIds: ["parent-tweet-1"],
      sourceAccount: "bob",
      contextSignals: [],
      threadSignals: [],
      noveltySignals: [],
      riskSignals: [],
      contextStrengthScore: 0,
      threadPotentialScore: 0,
      voiceFitScore: 0,
      noveltyScore: 0,
      spamRiskScore: 0,
      policyRiskScore: 0,
      repetitionRiskScore: 0,
      finalScore: 12,
      recommendedVoice: "stillhalter",
      recommendedMode: "proactive_timeline_reply",
      recommendedIntent: "proactive_timeline_reply",
      selectedBecause: ["ranked"],
      rejectedBecause: [],
      scoreBreakdown: {},
      policyDecision: "allow" as const,
    };

    const raw = buildRawTriggerInputFromTimelineCandidate(timelineCandidate);
    const candidate = buildEngagementCandidate(raw);
    const bundle = maybeBuildConversationBundle({
      candidate,
      sourceTweet: {
        tweetId: candidate.tweetId,
        conversationId: candidate.conversationId,
        authorId: candidate.authorId,
        normalizedText: candidate.normalizedText,
        discoveredAt: candidate.discoveredAt,
      },
      authorContext: {
        authorId: candidate.authorId,
        authorHandle: "bob",
        sourceAccount: "timeline",
      },
      sourceMetadata: raw.metadata,
    });
    const canonical = toCanonicalExecutionInput(candidate, bundle);

    expect(raw.triggerType).toBe("timeline");
    expect(raw.sourceEventId).toBe("timeline:tweet-1");
    expect(candidate.candidateId).toBe("timeline:tweet-1");
    expect(candidate.normalizedText).toBe("A thoughtful timeline reply with a clear question?");
    expect(raw.parentRef?.tweetId).toBe("parent-tweet-1");
    expect(candidate.parentRef?.tweetId).toBe("parent-tweet-1");
    expect(bundle?.sourceTweet?.tweetId).toBe("tweet-1");
    expect(bundle?.parentRef?.tweetId).toBe("parent-tweet-1");
    expect(bundle?.authorContext?.sourceAccount).toBe("timeline");
    expect(canonical.event_id).toBe("timeline:tweet-1");
    expect(canonical.trigger_type).toBe("reply");
    expect(canonical.author_handle).toBe("@bob");
    expect(canonical.context).toBeUndefined();
  });

  it("builds a sparse conversation bundle from the shared candidate boundary", () => {
    const raw = {
      triggerType: "mention" as const,
      sourceEventId: "mention-2",
      tweetId: "mention-2",
      conversationId: "conv-3",
      authorId: "author-3",
      parentRef: {
        tweetId: "parent-2",
        conversationId: "conv-3",
      },
      discoveredAt: "2026-03-22T12:00:00.000Z",
      rawText: "Hello there",
      metadata: { authorHandle: "alice", sourceAccount: "mentions" },
    };
    const candidate = buildEngagementCandidate(raw);

    const bundle = maybeBuildConversationBundle({
      candidate,
    });

    expect(bundle?.sourceTweet?.tweetId).toBe("mention-2");
    expect(bundle?.parentRef?.tweetId).toBe("parent-2");
    expect(bundle?.authorContext?.authorId).toBe("author-3");
    expect(bundle?.sourceMetadata?.authorHandle).toBe("alice");
  });

  it("keeps the bundle sparse when no cheap parent hint is present", () => {
    const raw = {
      triggerType: "mention" as const,
      sourceEventId: "mention-3",
      tweetId: "mention-3",
      conversationId: undefined,
      authorId: "author-4",
      discoveredAt: "2026-03-22T12:30:00.000Z",
      rawText: "Hello there",
      metadata: { authorHandle: "alice", sourceAccount: "mentions" },
    };
    const candidate = buildEngagementCandidate(raw);

    const bundle = maybeBuildConversationBundle({
      candidate,
      sourceTweet: {
        tweetId: candidate.tweetId,
        conversationId: candidate.conversationId,
        authorId: candidate.authorId,
        normalizedText: candidate.normalizedText,
        discoveredAt: candidate.discoveredAt,
      },
      sourceMetadata: raw.metadata,
    });

    expect(raw.parentRef).toBeUndefined();
    expect(candidate.parentRef).toBeUndefined();
    expect(bundle?.parentRef).toBeUndefined();
    expect(bundle?.sourceTweet?.tweetId).toBe("mention-3");
  });
});

import { describe, expect, it } from "vitest";
import {
  buildEngagementCandidate,
  buildRawTriggerInputFromMention,
  buildRawTriggerInputFromTimelineCandidate,
  toCanonicalExecutionInput,
} from "../../src/engagement/candidateBoundary.js";

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
    } as const;

    const raw = buildRawTriggerInputFromMention(mention, "mentions");
    const candidate = buildEngagementCandidate(raw);
    const canonical = toCanonicalExecutionInput(candidate);

    expect(raw.triggerType).toBe("mention");
    expect(raw.sourceEventId).toBe("mention-1");
    expect(candidate.candidateId).toBe("mention-1");
    expect(candidate.normalizedText).toBe("Hello @Gnomes_onchain, can you help?");
    expect(canonical.event_id).toBe("mention-1");
    expect(canonical.trigger_type).toBe("mention");
    expect(canonical.author_handle).toBe("@alice");
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
      referencedTweetIds: [],
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
    const canonical = toCanonicalExecutionInput(candidate);

    expect(raw.triggerType).toBe("timeline");
    expect(raw.sourceEventId).toBe("timeline:tweet-1");
    expect(candidate.candidateId).toBe("timeline:tweet-1");
    expect(candidate.normalizedText).toBe("A thoughtful timeline reply with a clear question?");
    expect(canonical.event_id).toBe("timeline:tweet-1");
    expect(canonical.trigger_type).toBe("reply");
    expect(canonical.author_handle).toBe("@bob");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStoreCache } from "../../../src/state/storeFactory.js";
import type { Mention } from "../../../src/poller/mentionsMapper.js";

const replyMock = vi.fn(async () => ({ id: "reply-1", text: "ok" }));
const handleEventMock = vi.fn(async () => ({ action: "publish", reply_text: "mention reply" }));
const shouldPostMock = vi.fn(() => ({ action: "post", reason: "allowed" }));
const budgetMock = vi.fn(async () => ({
  allowed: true,
  remaining: 29,
  used: 0,
  limit: 30,
}));
const buildRawTriggerInputMock = vi.fn((mention: Mention, source: "mentions" | "search") => ({
  triggerType: "mention" as const,
  sourceEventId: mention.id,
  tweetId: mention.id,
  conversationId: mention.conversation_id,
  authorId: mention.author_id,
  discoveredAt: mention.created_at ?? new Date().toISOString(),
  rawText: mention.text,
  metadata: {
    source,
    authorHandle: mention.authorUsername ? `@${mention.authorUsername.toLowerCase()}` : undefined,
  },
}));
const buildEngagementCandidateMock = vi.fn((raw: { sourceEventId?: string; tweetId: string; rawText?: string }) => ({
  candidateId: raw.sourceEventId ?? raw.tweetId,
  triggerType: "mention" as const,
  tweetId: raw.tweetId,
  normalizedText: raw.rawText?.trim() ?? "",
  discoveredAt: new Date().toISOString(),
}));
const maybeBuildConversationBundleMock = vi.fn(
  (input: {
    candidate: {
      tweetId: string;
      conversationId?: string;
      authorId?: string;
      normalizedText: string;
      discoveredAt: string;
      sourceMetadata?: Record<string, unknown>;
    };
    sourceTweet?: {
      tweetId: string;
      conversationId?: string;
      authorId?: string;
      normalizedText?: string;
      discoveredAt?: string;
    };
    authorContext?: {
      authorId?: string;
      authorHandle?: string;
      sourceAccount?: string;
    };
    sourceMetadata?: Record<string, unknown>;
  }) => ({
    sourceTweet:
      input.sourceTweet ?? {
        tweetId: input.candidate.tweetId,
        conversationId: input.candidate.conversationId,
        authorId: input.candidate.authorId,
        normalizedText: input.candidate.normalizedText,
        discoveredAt: input.candidate.discoveredAt,
      },
    authorContext: input.authorContext,
    sourceMetadata: input.sourceMetadata ?? input.candidate.sourceMetadata,
  })
);
const toCanonicalExecutionInputMock = vi.fn(() => ({
  event_id: "mention-event",
  platform: "twitter" as const,
  trigger_type: "mention" as const,
  author_handle: "@alice",
  author_id: "author-1",
  text: "mention reply",
  parent_text: null,
  quoted_text: null,
  conversation_context: [],
  cashtags: [],
  hashtags: [],
  urls: [],
  timestamp: new Date().toISOString(),
}));

let complianceConfig = {
  aiApproval: true,
  optInHandles: [] as string[],
  optOutHandles: [] as string[],
};

vi.mock("../../../src/clients/xClient.js", () => ({
  createXClient: () => ({ reply: replyMock }),
}));

vi.mock("../../../src/clients/xApi.js", () => ({
  invokeXApiRequest: vi.fn(async ({ uri }: { uri: string }) => {
    if (uri.includes("/2/tweets/")) return { data: { id: "target-1" } };
    return {};
  }),
}));

vi.mock("../../../src/canonical/pipeline.js", () => ({
  handleEvent: handleEventMock,
}));

vi.mock("../../../src/engagement/candidateBoundary.js", () => ({
  buildRawTriggerInputFromMention: buildRawTriggerInputMock,
  buildEngagementCandidate: buildEngagementCandidateMock,
  toCanonicalExecutionInput: toCanonicalExecutionInputMock,
}));

vi.mock("../../../src/engagement/conversationBundle.js", () => ({
  maybeBuildConversationBundle: maybeBuildConversationBundleMock,
}));

vi.mock("../../../src/config/engagementComplianceConfig.js", () => ({
  readEngagementComplianceConfig: () => complianceConfig,
}));

vi.mock("../../../src/ops/launchGate.js", () => ({
  shouldPost: shouldPostMock,
  isPostingDisabled: () => false,
}));

vi.mock("../../../src/state/sharedBudgetGate.js", () => ({
  checkLLMBudget: budgetMock,
}));

function mention(overrides: Partial<Mention> = {}): Mention {
  return {
    id: "m-1",
    text: "Hi @Gnomes_onchain, can you help?",
    author_id: "author-1",
    authorUsername: "alice",
    conversation_id: "conv-1",
    created_at: new Date().toISOString(),
    referenced_tweets: [
      { type: "replied_to", id: "bot-1" },
    ],
    in_reply_to_user_id: "bot-1",
    ...overrides,
  };
}

describe("mention pipeline consent flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.USE_REDIS = "false";
    resetStoreCache();
    complianceConfig = {
      aiApproval: true,
      optInHandles: [],
      optOutHandles: [],
    };
  });

  it("engages an explicitly opted-in mention once and blocks the replay", async () => {
    complianceConfig = {
      aiApproval: true,
      optInHandles: ["alice"],
      optOutHandles: [],
    };
    const mentionId = `m-${Date.now()}-1`;

    const { processCanonicalMention } = await import("../../../src/worker/pollMentions.js");

    const deps = { llm: {} as never, botUserId: "bot-1" };
    const first = await processCanonicalMention(
      deps,
      { reply: replyMock } as never,
      mention({ id: mentionId }),
      false,
      "mentions"
    );
    const second = await processCanonicalMention(
      deps,
      { reply: replyMock } as never,
      mention({ id: mentionId }),
      false,
      "mentions"
    );

    expect(first).toBeDefined();
    expect(second).toBeUndefined();
    expect(replyMock).toHaveBeenCalledTimes(1);
    expect(buildRawTriggerInputMock).toHaveBeenCalledTimes(1);
    expect(buildEngagementCandidateMock).toHaveBeenCalledTimes(1);
    expect(maybeBuildConversationBundleMock).toHaveBeenCalledTimes(1);
    expect(toCanonicalExecutionInputMock).toHaveBeenCalledTimes(1);
    expect(toCanonicalExecutionInputMock.mock.calls[0]?.[1]).toBeDefined();
  });

  it("holds a valid candidate when budget is exhausted", async () => {
    const mentionId = `m-${Date.now()}-2`;
    budgetMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      used: 30,
      limit: 30,
      skipReason: "budget_exceeded",
    });

    const { processCanonicalMention } = await import("../../../src/worker/pollMentions.js");

    const deps = { llm: {} as never, botUserId: "bot-1" };
    const result = await processCanonicalMention(
      deps,
      { reply: replyMock } as never,
      mention({ id: mentionId }),
      false,
      "mentions"
    );

    expect(result).toBeUndefined();
    expect(replyMock).not.toHaveBeenCalled();
  });

  it("blocks opt-out even for a direct mention", async () => {
    complianceConfig = {
      aiApproval: true,
      optInHandles: [],
      optOutHandles: ["alice"],
    };
    const mentionId = `m-${Date.now()}-3`;

    const { processCanonicalMention } = await import("../../../src/worker/pollMentions.js");

    const deps = { llm: {} as never, botUserId: "bot-1" };
    const result = await processCanonicalMention(
      deps,
      { reply: replyMock } as never,
      mention({ id: mentionId }),
      false,
      "mentions"
    );

    expect(result).toBeUndefined();
    expect(replyMock).not.toHaveBeenCalled();
  });
});

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

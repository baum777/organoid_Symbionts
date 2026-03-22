import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStoreCache } from "../../../src/state/storeFactory.js";

const replyMock = vi.fn(async () => ({ id: "reply-1", text: "ok" }));
const handleEventMock = vi.fn(async () => ({ action: "publish", reply_text: "timeline reply" }));

const scoutMock = vi.fn(async () => ({
  tweets: [
    {
      id: "tweet-1",
      conversation_id: "conv-1",
      author_id: "author-1",
      text: "Search-only candidate with no direct consent signal",
      created_at: new Date().toISOString(),
      public_metrics: { like_count: 2, reply_count: 1, quote_count: 0 },
    },
  ],
  userMap: new Map([["author-1", "alice"]]),
}));

const rankMock = vi.fn((candidates: Array<{ tweetId: string }>) => candidates as never[]);
const selectMock = vi.fn((candidates: Array<{ tweetId: string }>) => ({
  selected: candidates,
  rejected: [],
}));

vi.mock("../../../src/clients/xClient.js", () => ({
  createXClient: () => ({ reply: replyMock }),
}));

vi.mock("../../../src/clients/xApi.js", () => ({
  invokeXApiRequest: vi.fn(async ({ uri }: { uri: string }) => {
    if (uri.includes("/2/users/me")) return { data: { id: "bot-1" } };
    return {};
  }),
}));

vi.mock("../../../src/clients/llmClient.unified.js", () => ({
  createUnifiedLLMClient: () => ({}),
}));

vi.mock("../../../src/ops/llmCircuitBreaker.js", () => ({
  withCircuitBreaker: (client: unknown) => client,
}));

vi.mock("../../../src/canonical/pipeline.js", () => ({
  handleEvent: handleEventMock,
}));

vi.mock("../../../src/config/timelineEngagementConfig.js", () => ({
  readTimelineEngagementConfig: () => ({
    enabled: true,
    intervalMs: 1000,
    maxPerRun: 2,
    maxPerHour: 2,
    maxPerDay: 2,
    minContextScore: 50,
    minFinalScore: 50,
    requireThreadStructure: false,
    sourceAccounts: ["alice"],
    keywordFilters: [],
    authorCooldownMinutes: 60,
    conversationCooldownMinutes: 60,
  }),
}));

vi.mock("../../../src/config/engagementComplianceConfig.js", () => ({
  readEngagementComplianceConfig: () => ({
    aiApproval: true,
    optInHandles: [],
    optOutHandles: [],
  }),
}));

vi.mock("../../../src/engagement/timelineScout.js", () => ({
  scoutTimelineCandidates: scoutMock,
}));

vi.mock("../../../src/engagement/rankTimelineCandidates.js", () => ({
  rankTimelineCandidates: rankMock,
  selectTopTimelineCandidates: selectMock,
}));

describe("proactive engagement pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.USE_REDIS = "false";
    process.env.LAUNCH_MODE = "off";
    resetStoreCache();
  });

  it("fails closed for search-only candidates and never reaches generation or write", async () => {
    const { runTimelineEngagementIteration } = await import("../../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(handleEventMock).not.toHaveBeenCalled();
    expect(replyMock).not.toHaveBeenCalled();
    expect(scoutMock).toHaveBeenCalledTimes(1);
    expect(rankMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledTimes(1);
  });
});

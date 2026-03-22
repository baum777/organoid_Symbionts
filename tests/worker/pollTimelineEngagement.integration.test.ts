import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetEventStates } from "../../src/state/eventStateStore.js";
import { resetStoreCache } from "../../src/state/storeFactory.js";

const replyMock = vi.fn(async () => ({ id: "reply-1", text: "ok" }));
const handleEventMock = vi.fn(async () => ({ action: "publish", reply_text: "gnome says hi" }));
let currentTweetId = `tweet-${Date.now()}`;
const scoutMock = vi.fn(async () => ({
  tweets: [
    {
      id: currentTweetId,
      conversation_id: "conv-1",
      author_id: "author-1",
      text: "Market thesis because liquidity and builder architecture are shifting across venues, therefore capital rotates slower and this opens room for structured execution strategies?",
      created_at: new Date().toISOString(),
      public_metrics: { reply_count: 5, like_count: 10, quote_count: 1 },
    },
  ],
  userMap: new Map([["author-1", "alice"]]),
}));
const rankMock = vi.fn((candidates: Array<{ tweetId: string }>) => candidates as never[]);
const selectMock = vi.fn((candidates: Array<{ tweetId: string }>) => ({
  selected: candidates,
  rejected: [],
}));
const lockMock = vi.fn(async () => "acquired" as "acquired" | "denied" | "error");
const releaseLockMock = vi.fn(async () => true);
const reserveMock = vi.fn(async () => ({
  status: "reserved" as const,
  used: 1,
  remaining: 29,
  limit: 30,
  weight: 1,
}));
const policyMock = vi.fn(async () => ({ allowed: true, reason: "allow" }));
const decisionMock = vi.fn(() => ({ decision: "ENGAGE", reason: "allow" }));
const buildRawTriggerInputMock = vi.fn((candidate: { tweetId: string; authorId: string; conversationId: string; createdAt: string; text: string; authorUsername: string; sourceAccount: string; finalScore: number; selectedBecause: string[]; scoreBreakdown: Record<string, number>; policyDecision: string }) => ({
  triggerType: "timeline" as const,
  sourceEventId: `timeline:${candidate.tweetId}`,
  tweetId: candidate.tweetId,
  conversationId: candidate.conversationId,
  authorId: candidate.authorId,
  discoveredAt: candidate.createdAt,
  rawText: candidate.text,
  metadata: {
    authorHandle: `@${candidate.authorUsername}`,
    sourceAccount: candidate.sourceAccount,
    finalScore: candidate.finalScore,
    selectedBecause: [...candidate.selectedBecause],
    scoreBreakdown: { ...candidate.scoreBreakdown },
    policyDecision: candidate.policyDecision,
  },
}));
const buildEngagementCandidateMock = vi.fn((raw: { sourceEventId?: string; tweetId: string; rawText?: string; discoveredAt: string }) => ({
  candidateId: raw.sourceEventId ?? raw.tweetId,
  triggerType: "timeline" as const,
  tweetId: raw.tweetId,
  normalizedText: raw.rawText?.trim() ?? "",
  discoveredAt: raw.discoveredAt,
}));
const toCanonicalExecutionInputMock = vi.fn((candidate: { candidateId: string; triggerType: string; tweetId: string; normalizedText: string; discoveredAt: string }) => ({
  event_id: candidate.candidateId,
  platform: "twitter" as const,
  trigger_type: "reply" as const,
  author_handle: "@alice",
  author_id: "author-1",
  text: candidate.normalizedText,
  parent_text: null,
  quoted_text: null,
  conversation_context: [],
  cashtags: [],
  hashtags: [],
  urls: [],
  timestamp: candidate.discoveredAt,
}));

vi.mock("../../src/clients/xClient.js", () => ({
  createXClient: () => ({ reply: replyMock }),
}));

vi.mock("../../src/canonical/pipeline.js", () => ({
  handleEvent: handleEventMock,
}));

vi.mock("../../src/clients/xApi.js", () => ({
  invokeXApiRequest: vi.fn(async ({ uri }: { uri: string }) => {
    if (uri.includes("/2/users/me")) return { data: { id: "bot-1" } };
    if (uri.includes("/2/tweets/search/recent")) {
      return {
        data: [
          {
            id: currentTweetId,
            conversation_id: "conv-1",
            author_id: "author-1",
            text: "Market thesis because liquidity and builder architecture are shifting across venues, therefore capital rotates slower and this opens room for structured execution strategies?",
            created_at: new Date().toISOString(),
            public_metrics: { reply_count: 5, like_count: 10, quote_count: 1 },
          },
        ],
        includes: { users: [{ id: "author-1", username: "alice" }] },
      };
    }
    return {};
  }),
}));

vi.mock("../../src/engagement/timelineScout.js", () => ({
  scoutTimelineCandidates: scoutMock,
}));

vi.mock("../../src/engagement/rankTimelineCandidates.js", () => ({
  rankTimelineCandidates: rankMock,
  selectTopTimelineCandidates: selectMock,
}));

vi.mock("../../src/ops/pollLock.js", () => ({
  getHolderId: () => "timeline-test-holder",
  POLL_LOCK_RETRY_MS: 1,
  releasePollLock: releaseLockMock,
  tryAcquirePollLock: lockMock,
}));

vi.mock("../../src/policy/proactiveEngagementPolicy.js", () => ({
  evaluateProactiveEngagementPolicy: policyMock,
}));

vi.mock("../../src/engagement/engagementDecision.js", () => ({
  decideEngagement: decisionMock,
}));

vi.mock("../../src/engagement/candidateBoundary.js", () => ({
  buildRawTriggerInputFromTimelineCandidate: buildRawTriggerInputMock,
  buildEngagementCandidate: buildEngagementCandidateMock,
  toCanonicalExecutionInput: toCanonicalExecutionInputMock,
}));

vi.mock("../../src/state/sharedBudgetGate.js", () => ({
  checkLLMBudget: vi.fn(async () => ({
    allowed: true,
    remaining: 29,
    used: 1,
    limit: 30,
  })),
  reserveLLMBudget: reserveMock,
}));

vi.mock("../../src/config/timelineEngagementConfig.js", () => ({
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

vi.mock("../../src/config/engagementComplianceConfig.js", () => ({
  readEngagementComplianceConfig: () => ({
    aiApproval: true,
    optInHandles: ["alice"],
    optOutHandles: [],
  }),
}));

function resetHarness(): void {
  replyMock.mockClear();
  handleEventMock.mockClear();
  scoutMock.mockClear();
  rankMock.mockClear();
  selectMock.mockClear();
  lockMock.mockClear();
  releaseLockMock.mockClear();
  reserveMock.mockClear();
  policyMock.mockClear();
  decisionMock.mockClear();
  buildRawTriggerInputMock.mockClear();
  buildEngagementCandidateMock.mockClear();
  toCanonicalExecutionInputMock.mockClear();
}

describe("timeline engagement worker", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.USE_REDIS = "false";
    process.env.TIMELINE_ENGAGEMENT_ENABLED = "true";
    process.env.TIMELINE_SOURCE_ACCOUNTS = "alice";
    process.env.TIMELINE_ENGAGEMENT_MAX_PER_RUN = "2";
    process.env.LAUNCH_MODE = "off";
    resetStoreCache();
    await resetEventStates();
    currentTweetId = `tweet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    resetHarness();
  });

  it("defaults to skip for timeline candidates without explicit engagement approval", async () => {
    decisionMock.mockReturnValueOnce({ decision: "REVIEW", reason: "no_consent" });

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(scoutMock).toHaveBeenCalledTimes(1);
    expect(handleEventMock).not.toHaveBeenCalled();
    expect(replyMock).not.toHaveBeenCalled();
    expect(reserveMock).not.toHaveBeenCalled();
  });

  it("stops before scout when leader lock is denied", async () => {
    lockMock.mockResolvedValueOnce("denied");

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(lockMock).toHaveBeenCalledTimes(1);
    expect(scoutMock).not.toHaveBeenCalled();
    expect(handleEventMock).not.toHaveBeenCalled();
    expect(reserveMock).not.toHaveBeenCalled();
  });

  it("fails closed when leader lock errors", async () => {
    lockMock.mockResolvedValueOnce("error");

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(lockMock).toHaveBeenCalledTimes(1);
    expect(scoutMock).not.toHaveBeenCalled();
    expect(handleEventMock).not.toHaveBeenCalled();
    expect(reserveMock).not.toHaveBeenCalled();
  });

  it("does not reserve budget when the proactive policy rejects", async () => {
    policyMock.mockResolvedValueOnce({ allowed: false, reason: "policy_reject" });

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(scoutMock).toHaveBeenCalledTimes(1);
    expect(policyMock).toHaveBeenCalledTimes(1);
    expect(reserveMock).not.toHaveBeenCalled();
    expect(handleEventMock).not.toHaveBeenCalled();
  });

  it("skips handleEvent when reservation fails", async () => {
    reserveMock.mockResolvedValueOnce({
      status: "denied",
      used: 30,
      remaining: 0,
      limit: 30,
      weight: 1,
      reason: "budget_exceeded",
    });

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(scoutMock).toHaveBeenCalledTimes(1);
    expect(policyMock).toHaveBeenCalledTimes(1);
    expect(reserveMock).toHaveBeenCalledTimes(1);
    expect(handleEventMock).not.toHaveBeenCalled();
    expect(replyMock).not.toHaveBeenCalled();
  });

  it("enters the canonical path exactly once when lock, policy, and reservation succeed", async () => {
    reserveMock.mockResolvedValueOnce({
      status: "reserved",
      used: 1,
      remaining: 29,
      limit: 30,
      weight: 1,
    });

    const { runTimelineEngagementIteration } = await import("../../src/worker/pollTimelineEngagement.js");

    await runTimelineEngagementIteration();

    expect(scoutMock).toHaveBeenCalledTimes(1);
    expect(rankMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(policyMock).toHaveBeenCalledTimes(1);
    expect(reserveMock).toHaveBeenCalledTimes(1);
    expect(handleEventMock).toHaveBeenCalledTimes(1);
    expect(replyMock).toHaveBeenCalledTimes(1);
    expect(buildRawTriggerInputMock).toHaveBeenCalledTimes(1);
    expect(buildEngagementCandidateMock).toHaveBeenCalledTimes(1);
    expect(toCanonicalExecutionInputMock).toHaveBeenCalledTimes(1);
  });
});

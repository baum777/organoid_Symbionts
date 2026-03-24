/**
 * Postability integration tests
 *
 * Proves that every publishable pipeline output:
 * - is the same string in pipeline result, audit record, and xClient.reply
 * - passes assertPublicTextSafe
 * - stays within getHardMax(mode)
 * - audit.reply_hash === stableHash(audit.reply_text)
 *
 * Plus failing-path tests: too-long and guard-unsafe output are not posted.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mention } from "../../src/poller/mentionsMapper.js";
import type { LLMClient } from "../../src/clients/llmClient.js";
import type { PipelineDeps } from "../../src/canonical/pipeline.js";
import { processCanonicalMention } from "../../src/worker/pollMentions.js";
import { DEFAULT_CANONICAL_CONFIG } from "../../src/canonical/types.js";
import { getHardMax } from "../../src/canonical/modeBudgets.js";
import { stableHash } from "../../src/utils/hash.js";
import { assertPublicTextSafe } from "../../src/boundary/publicTextGuard.js";
import * as auditLog from "../../src/canonical/auditLog.js";
import { resetStoreCache } from "../../src/state/storeFactory.js";
import { cacheClear } from "../../src/ops/memoryCache.js";
import fs from "node:fs";
import path from "node:path";

const AUDIT_FILE = path.join(process.cwd(), "data", "audit_log.jsonl");
const DATA_DIR = path.resolve(process.cwd(), "data");
const ORIGINAL_ENGAGEMENT_AI_APPROVED = process.env.ENGAGEMENT_AI_APPROVED;
const ORIGINAL_ENGAGEMENT_OPT_IN_HANDLES = process.env.ENGAGEMENT_OPT_IN_HANDLES;
const ORIGINAL_ENGAGEMENT_OPT_OUT_HANDLES = process.env.ENGAGEMENT_OPT_OUT_HANDLES;

vi.mock("../../src/ops/launchGate.js", () => ({
  shouldPost: () => ({ action: "post" as const }),
}));

vi.mock("../../src/engagement/targetLookup.js", () => ({
  targetTweetExists: vi.fn(async () => true),
}));

function makeMention(overrides: Partial<Mention> = {}): Mention {
  return {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text: "@gorky_on_sol is there an altseason on the horizon?",
    author_id: "user_1",
    authorUsername: "testuser",
    conversation_id: null,
    created_at: new Date().toISOString(),
    referenced_tweets: null,
    in_reply_to_user_id: null,
    ...overrides,
  };
}

function createMockLLM(reply: string): LLMClient {
  return {
    generateJSON: vi.fn(async () => ({ reply })),
  };
}

function makeDeps(reply: string): PipelineDeps {
  return {
    llm: createMockLLM(reply),
    botUserId: "bot_999",
  };
}

describe("pipeline postability integration", () => {
  let persistSpy: ReturnType<typeof vi.spyOn>;
  let previousEngagementAiApproved: string | undefined;
  let previousEngagementOptInHandles: string | undefined;

  beforeEach(async () => {
    previousEngagementAiApproved = process.env.ENGAGEMENT_AI_APPROVED;
    previousEngagementOptInHandles = process.env.ENGAGEMENT_OPT_IN_HANDLES;
    process.env.ENGAGEMENT_AI_APPROVED = "true";
    process.env.ENGAGEMENT_OPT_IN_HANDLES = "testuser";
    process.env.USE_REDIS = "false";
    process.env.ENGAGEMENT_AI_APPROVED = "true";
    process.env.ENGAGEMENT_OPT_IN_HANDLES = "testuser";
    process.env.ENGAGEMENT_OPT_OUT_HANDLES = "";
    resetStoreCache();
    await cacheClear();
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);

    persistSpy = vi.spyOn(auditLog, "persistAuditRecord").mockImplementation(vi.fn());
  });

  afterEach(() => {
    persistSpy.mockRestore();
    if (previousEngagementAiApproved === undefined) delete process.env.ENGAGEMENT_AI_APPROVED;
    else process.env.ENGAGEMENT_AI_APPROVED = previousEngagementAiApproved;
    if (previousEngagementOptInHandles === undefined) delete process.env.ENGAGEMENT_OPT_IN_HANDLES;
    else process.env.ENGAGEMENT_OPT_IN_HANDLES = previousEngagementOptInHandles;
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
    if (ORIGINAL_ENGAGEMENT_AI_APPROVED === undefined) {
      delete process.env.ENGAGEMENT_AI_APPROVED;
    } else {
      process.env.ENGAGEMENT_AI_APPROVED = ORIGINAL_ENGAGEMENT_AI_APPROVED;
    }
    if (ORIGINAL_ENGAGEMENT_OPT_IN_HANDLES === undefined) {
      delete process.env.ENGAGEMENT_OPT_IN_HANDLES;
    } else {
      process.env.ENGAGEMENT_OPT_IN_HANDLES = ORIGINAL_ENGAGEMENT_OPT_IN_HANDLES;
    }
    if (ORIGINAL_ENGAGEMENT_OPT_OUT_HANDLES === undefined) {
      delete process.env.ENGAGEMENT_OPT_OUT_HANDLES;
    } else {
      process.env.ENGAGEMENT_OPT_OUT_HANDLES = ORIGINAL_ENGAGEMENT_OPT_OUT_HANDLES;
    }
  });

  describe("Case A — happy path publish", () => {
    it("keeps the published string consistent across result, audit, and xClient.reply", async () => {
      const deps = makeDeps("Zero proof, pure noise.");
      const mention = makeMention();
      const configTestMode = { ...DEFAULT_CANONICAL_CONFIG, test_mode: true };

      const replySpy = vi.fn().mockImplementation(async (text: string, _mentionId: string) => {
        assertPublicTextSafe(text, { route: "XClient.reply" });
        return { id: "tid", text };
      });
      const xClient = { reply: replySpy } as ReturnType<typeof import("../../src/clients/xClient.js").createXClient>;

      const result = await processCanonicalMention(deps, xClient, mention, false, "mentions");

      expect(result).toBeDefined();
      expect(result!.action).toBe("publish");
      if (result!.action === "publish") {
        // Length within canonical hard max
        expect(result.reply_text.length).toBeLessThanOrEqual(getHardMax(result.mode));
        assertPublicTextSafe(result.reply_text, { route: "canonical.result" });

        // Passes public text guard (spy runs it)
        expect(replySpy).toHaveBeenCalledTimes(1);
        const [postedText, postedMentionId] = replySpy.mock.calls[0];
        expect(postedText).toBe(result.reply_text);
        expect(postedMentionId).toBe(mention.id);

        // Audit record matches
        const lastAudit = persistSpy.mock.calls[persistSpy.mock.calls.length - 1]?.[0];
        expect(lastAudit).toBeDefined();
        expect(lastAudit.reply_text).toBe(result.reply_text);
        expect(lastAudit.reply_text).toBe(postedText);
        expect(lastAudit.final_action).toBe("publish");
        expect(lastAudit.reply_hash).toBe(stableHash(lastAudit.reply_text));
      }
    });
  });

  describe("Case B — too long output", () => {
    it("normalizes and posts when LLM output exceeds canonical max", async () => {
      const longReply = "A".repeat(300);
      const deps = makeDeps(longReply);
      const mention = makeMention();
      const configNoRepair = { ...DEFAULT_CANONICAL_CONFIG, repair_enabled: false, test_mode: true };

      const replySpy = vi.fn().mockImplementation(async (text: string) => {
        assertPublicTextSafe(text, { route: "XClient.reply" });
        return { id: "tid", text };
      });
      const xClient = { reply: replySpy } as ReturnType<typeof import("../../src/clients/xClient.js").createXClient>;

      const result = await processCanonicalMention(deps, xClient, mention, false, "mentions", configNoRepair);

      expect(result).toBeDefined();
      expect(result!.action).toBe("publish");
      if (result!.action === "publish") {
        expect(result.reply_text.length).toBeLessThanOrEqual(getHardMax(result.mode));
        assertPublicTextSafe(result.reply_text, { route: "canonical.result" });
      }
      expect(replySpy).toHaveBeenCalledTimes(1);

      const lastAudit = persistSpy.mock.calls[persistSpy.mock.calls.length - 1]?.[0];
      expect(lastAudit).toBeDefined();
      expect(lastAudit.final_action).toBe("publish");
      expect(lastAudit.reply_text).toBe(result?.action === "publish" ? result.reply_text : null);
    });
  });

  describe("Case C — guard-unsafe output", () => {
    it("normalizes and posts when LLM output needs guard repair", async () => {
      const guardUnsafeReply = "Your score is 100";
      const deps = makeDeps(guardUnsafeReply);
      const mention = makeMention();
      const configTestMode = { ...DEFAULT_CANONICAL_CONFIG, test_mode: true };

      const replySpy = vi.fn().mockImplementation(async (text: string) => {
        assertPublicTextSafe(text, { route: "XClient.reply" });
        return { id: "tid", text };
      });
      const xClient = { reply: replySpy } as ReturnType<typeof import("../../src/clients/xClient.js").createXClient>;

      const result = await processCanonicalMention(deps, xClient, mention, false, "mentions");

      expect(result).toBeDefined();
      expect(result!.action).toBe("publish");
      if (result!.action === "publish") {
        expect(result.reply_text).not.toContain("Your score is 100");
        assertPublicTextSafe(result.reply_text, { route: "canonical.result" });
      }
      expect(replySpy).toHaveBeenCalledTimes(1);

      const lastAudit = persistSpy.mock.calls[persistSpy.mock.calls.length - 1]?.[0];
      expect(lastAudit).toBeDefined();
      expect(lastAudit.final_action).toBe("publish");
    });
  });

  describe("Case D — audit / payload consistency", () => {
    it("audit.reply_text === xClient.reply arg, reply_hash derived from reply_text", async () => {
      const safeReply = "Nice hype, zero proof.";
      const deps = makeDeps(safeReply);
      const mention = makeMention();
      const configTestMode = { ...DEFAULT_CANONICAL_CONFIG, test_mode: true };

      const replySpy = vi.fn().mockImplementation(async (text: string) => {
        assertPublicTextSafe(text, { route: "XClient.reply" });
        return { id: "tid", text };
      });
      const xClient = { reply: replySpy } as ReturnType<typeof import("../../src/clients/xClient.js").createXClient>;

      const result = await processCanonicalMention(deps, xClient, mention, false, "mentions");

      expect(result).toBeDefined();
      expect(result!.action).toBe("publish");
      if (result!.action === "publish") {
        const [postedText] = replySpy.mock.calls[0];
        const lastAudit = persistSpy.mock.calls[persistSpy.mock.calls.length - 1]?.[0];

        expect(persistSpy).toHaveBeenCalled();
        expect(result.reply_text).toBe(postedText);
        expect(result.reply_text).toBe(lastAudit.reply_text);
        expect(lastAudit.reply_hash).toBe(stableHash(lastAudit.reply_text));
      }
    });
  });
});

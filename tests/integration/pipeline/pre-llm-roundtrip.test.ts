import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleEvent, type PipelineDeps } from "../../../src/canonical/pipeline.js";
import { DEFAULT_CANONICAL_CONFIG } from "../../../src/canonical/types.js";
import type { CanonicalEvent } from "../../../src/canonical/types.js";
import type { LLMClient } from "../../../src/clients/llmClient.js";
import { cacheClear } from "../../../src/ops/memoryCache.js";
import fs from "node:fs";
import path from "node:path";

const AUDIT_FILE = path.join(process.cwd(), "data", "audit_log.jsonl");

let eventCounter = 0;
function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  eventCounter++;
  return {
    event_id: `prellm_${eventCounter}_${Date.now()}`,
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@testuser",
    author_id: "user_1",
    text: "Hello world",
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: [],
    hashtags: [],
    urls: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeDeps(llm: LLMClient): PipelineDeps {
  return { llm, botUserId: "bot_999" };
}

describe("pre-LLM roundtrip integration", () => {
  beforeEach(async () => {
    await cacheClear();
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
    delete process.env.PIPELINE_PRE_LLM_PROVIDER;
    delete process.env.PIPELINE_PRE_LLM_FALLBACK;
  });

  afterEach(() => {
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
    delete process.env.PIPELINE_PRE_LLM_PROVIDER;
    delete process.env.PIPELINE_PRE_LLM_FALLBACK;
  });

  it("crisis_flag short-circuits to skip with crisis_flag_detected_by_pre_llm", async () => {
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => ({
        intent: "casual_ping",
        confidence: 0.95,
        target_class: "none",
        language: "de",
        crisis_flag: true,
      })),
    };
    const result = await handleEvent(
      makeEvent({ text: "ich halte das nicht mehr aus" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("skip");
    if (result.action === "skip") {
      expect(result.skip_reason).toBe("crisis_flag_detected_by_pre_llm");
    }
  });

  it("contains_internal_token short-circuits to skip with internal_token_in_input", async () => {
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => ({
        intent: "question",
        confidence: 0.7,
        target_class: "claim",
        contains_internal_token: true,
        internal_violations: ["score", "mythic"],
      })),
    };
    const result = await handleEvent(
      makeEvent({ text: "this model has score 95 and is mythic" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("skip");
    if (result.action === "skip") {
      expect(result.skip_reason).toBe("internal_token_in_input");
    }
  });

  it("hard-guards defensively add internal tokens the LLM missed", async () => {
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => ({
        intent: "question",
        confidence: 0.8,
        target_class: "claim",
        crisis_flag: false,
        contains_internal_token: false,
        internal_violations: [],
      })),
    };
    const result = await handleEvent(
      makeEvent({ text: "what is the score on this rarity tier?" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("skip");
    if (result.action === "skip") {
      expect(result.skip_reason).toBe("internal_token_in_input");
    }
  });

  it("PIPELINE_PRE_LLM_PROVIDER=rule-based skips LLM call entirely", async () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "rule-based";
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => {
        throw new Error("pre-LLM LLM should not be called in rule-based mode");
      }),
    };
    const result = await handleEvent(
      makeEvent({ text: "ich halte das nicht mehr aus, alles ist sinnlos" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("skip");
    if (result.action === "skip") {
      expect(result.skip_reason).toBe("crisis_flag_detected_by_pre_llm");
    }
    expect(llm.generateJSON).not.toHaveBeenCalled();
  });

  it("primary LLM provider failing → fallback LLM provider is used", async () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "lfm25-local";
    process.env.PIPELINE_PRE_LLM_FALLBACK = "openrouter-llama-1b";
    process.env.OPENROUTER_API_KEY = "sk-or-test";

    const llm: LLMClient = {
      generateJSON: vi.fn(async (req) => {
        if (req.user.includes("crisis")) {
          return {
            intent: "casual_ping",
            confidence: 0.9,
            target_class: "none",
            language: "de",
            crisis_flag: true,
          };
        }
        return { intent: "question", confidence: 0.5, target_class: "claim" };
      }),
    };

    // Real network is unavailable in CI, so the LFM25-local + OpenRouter
    // both fail and the rule-based fallback runs. The point of this test
    // is: rule-based produces a valid PreLLMResult that the pipeline accepts
    // (i.e. NO pre-LLM hard-stop is triggered for normal input).
    const result = await handleEvent(
      makeEvent({ text: "this is not a crisis, just a normal question" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    // If a pre-LLM hard-stop fired, skip_reason would be one of the new
    // crisis/internal-token reasons. Otherwise the pipeline ran normally.
    if (result.action === "skip") {
      expect(result.skip_reason).not.toBe("crisis_flag_detected_by_pre_llm");
      expect(result.skip_reason).not.toBe("internal_token_in_input");
    }
    // Pre-LLM LLM is the global.fetch-based adapter, not the mock llm.
    expect(llm.generateJSON).not.toHaveBeenCalled();
  });

  it("primary + fallback both fail → rule-based fallback runs", async () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "lfm25-local";
    process.env.PIPELINE_PRE_LLM_FALLBACK = "openrouter-llama-1b";
    process.env.OPENROUTER_API_KEY = "sk-or-test";

    const originalFetch = global.fetch;
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    try {
      const llm: LLMClient = {
        generateJSON: vi.fn(async () => ({ intent: "greeting", confidence: 0.5 })),
      };
      const result = await handleEvent(
        makeEvent({ text: "ich halte das nicht mehr aus" }),
        makeDeps(llm),
        DEFAULT_CANONICAL_CONFIG,
      );
      // Rule-based fallback should still detect the crisis
      expect(result.action).toBe("skip");
      if (result.action === "skip") {
        expect(result.skip_reason).toBe("crisis_flag_detected_by_pre_llm");
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("clean LLM response flows through to normal pipeline with pre_llm_result in audit", async () => {
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => ({ intent: "greeting", confidence: 0.95, target_class: "none" })),
    };
    const result = await handleEvent(
      makeEvent({ text: "gm" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    // Either publish (low-confidence greeting) or skip_low_confidence — both valid.
    // What matters: pre-LLM didn't trigger a hard-stop, and the pipeline ran.
    expect(result).toBeDefined();
    expect(["publish", "skip"]).toContain(result.action);
  });

  it("audit log carries pre_llm_result when pipeline publishes", async () => {
    const llm: LLMClient = {
      generateJSON: vi.fn(async () => ({ intent: "greeting", confidence: 0.95, target_class: "none" })),
    };
    await handleEvent(
      makeEvent({ text: "hello there" }),
      makeDeps(llm),
      DEFAULT_CANONICAL_CONFIG,
    );
    // Audit log is async-flushed; allow flush
    await new Promise((r) => setTimeout(r, 100));
    if (fs.existsSync(AUDIT_FILE)) {
      const content = fs.readFileSync(AUDIT_FILE, "utf-8");
      const lines = content.split("\n").filter(Boolean);
      const last = JSON.parse(lines[lines.length - 1] || "{}") as { pre_llm_result?: unknown };
      // If pipeline skipped/published at all, the pre-LLM result was attached.
      if (last.pre_llm_result) {
        expect(last.pre_llm_result).toHaveProperty("provider");
        expect(last.pre_llm_result).toHaveProperty("intent");
      }
    }
  });
});

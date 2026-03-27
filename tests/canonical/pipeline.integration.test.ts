import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleEvent, type PipelineDeps } from "../../src/canonical/pipeline.js";
import { DEFAULT_CANONICAL_CONFIG } from "../../src/canonical/types.js";
import type { CanonicalEvent } from "../../src/canonical/types.js";
import type { LLMClient } from "../../src/clients/llmClient.js";
import { cacheClear } from "../../src/ops/memoryCache.js";
import fs from "node:fs";
import path from "node:path";
import { hasEmbodimentGlyphMarker, stripEmbodimentGlyphs } from "../_helpers/embodimentGlyphs.js";

const AUDIT_FILE = path.join(process.cwd(), "data", "audit_log.jsonl");

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@testuser",
    author_id: "user_1",
    text: "$SOL mooning 100x gem guaranteed easy money LFG",
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: ["$SOL"],
    hashtags: [],
    urls: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function createMockLLM(reply = "Zero proof, pure noise."): LLMClient {
  return {
    generateJSON: vi.fn(async () => ({ reply })),
  };
}

function makeDeps(reply?: string): PipelineDeps {
  return {
    llm: createMockLLM(reply),
    botUserId: "bot_999",
  };
}

describe("pipeline integration", () => {
  beforeEach(async () => {
    await cacheClear();
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
  });
  afterEach(() => {
    if (fs.existsSync(AUDIT_FILE)) fs.unlinkSync(AUDIT_FILE);
  });

  it("publishes a valid reply for a hype mention", async () => {
    const result = await handleEvent(makeEvent(), makeDeps(), DEFAULT_CANONICAL_CONFIG);
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(hasEmbodimentGlyphMarker(result.reply_text)).toBe(true);
      expect(stripEmbodimentGlyphs(result.reply_text)).toBe("Zero proof, pure noise.");
      expect(result.thesis.primary).toBeTruthy();
      expect(["dry_one_liner", "analyst_meme_lite", "skeptical_breakdown", "soft_deflection"]).toContain(result.mode);
      expect(result.audit.final_action).toBe("publish");
    }
  });

  it("publishes a conceptual probe for wetware questions", async () => {
    const result = await handleEvent(
      makeEvent({ text: "what are wetware computers actually good for?" }),
      makeDeps("Wetware is useful when you want the substrate to do the thinking, not just the math."),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("neutral_clarification");
      expect(result.audit.path).toBe("audit");
      expect(result.audit.classifier_output.intent).toBe("conceptual_probe");
      expect(result.audit.classifierIntent).toBe("conceptual_probe");
      expect(result.audit.baseIntent).toBe("conceptual_probe");
      expect(result.audit.sourceIntent).toBe("conceptual_probe");
      expect(result.audit.orchestrationEligibleMinimal).toBe(true);
      expect(result.audit.fastPathBypassReason).toBe("no_fast_path_match");
      expect(result.audit.finalMode).toBe("neutral_clarification");
      expect(result.audit).toHaveProperty("silencePolicy");
      expect(result.audit).toHaveProperty("renderPolicy");
    }
  });

  it("rescues a continuation-style thread reply when thread context is present", async () => {
    const result = await handleEvent(
      makeEvent({
        trigger_type: "reply",
        text: "and where does execution actually break here?",
        conversation_context: ["parent: intake -> scoring -> orchestration"],
      }),
      makeDeps("The break usually shows up at the handoff between intake and scoring."),
      DEFAULT_CANONICAL_CONFIG,
    );

    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("neutral_clarification");
      expect(result.audit.path).toBe("social");
      expect(result.audit.classifier_output.intent).toBe("conversation_continue");
      expect(result.audit.classifier_output.baseIntent).toBe("question");
      expect(result.audit.classifierIntent).toBe("conversation_continue");
      expect(result.audit.baseIntent).toBe("question");
      expect(result.audit.sourceIntent).toBe("conversation_continue");
      expect(result.audit.hasParentContext).toBe(true);
      expect(result.audit.continuationSignal).toBe(true);
      expect(result.audit.continuationSupportScore).toBeGreaterThanOrEqual(0.66);
      expect(result.audit.finalMode).toBe("neutral_clarification");
    }
  });

  it("rescues a wetware follow-up into conversation_continue when thread context is present", async () => {
    const result = await handleEvent(
      makeEvent({
        trigger_type: "reply",
        text: "what about scaling?",
        parent_text: "We are comparing wetware readout, I/O, and scaling constraints.",
        conversation_context: ["parent: wetware readout, I/O, and scaling constraints"],
      }),
      makeDeps("Scaling usually fails at the interface and readout layer."),
      DEFAULT_CANONICAL_CONFIG,
    );

    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("neutral_clarification");
      expect(result.audit.path).toBe("social");
      expect(result.audit.classifier_output.intent).toBe("conversation_continue");
      expect(result.audit.classifier_output.baseIntent).toBe("question");
      expect(result.audit.classifierIntent).toBe("conversation_continue");
      expect(result.audit.baseIntent).toBe("question");
      expect(result.audit.sourceIntent).toBe("conversation_continue");
      expect(result.audit.hasParentContext).toBe(true);
      expect(result.audit.continuationSignal).toBe(true);
      expect(result.audit.finalMode).toBe("neutral_clarification");
    }
  });

  it("rescues a structured critique statement into skeptical_breakdown", async () => {
    const result = await handleEvent(
      makeEvent({
        text: "this architecture looks clean but I don't trust the incentives",
      }),
      makeDeps("The structure is cosmetic; the incentives are the weak point."),
      DEFAULT_CANONICAL_CONFIG,
    );

    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("skeptical_breakdown");
      expect(result.audit.path).toBe("audit");
      expect(result.audit.classifier_output.intent).toBe("structured_critique");
      expect(result.audit.classifier_output.baseIntent).toBe("irrelevant");
      expect(result.audit.classifierIntent).toBe("structured_critique");
      expect(result.audit.baseIntent).toBe("irrelevant");
      expect(result.audit.sourceIntent).toBe("structured_critique");
      expect(result.audit.structuredCritiqueSignal).toBe(true);
      expect(result.audit.structuredCritiqueSupportScore).toBeGreaterThanOrEqual(0.66);
      expect(result.audit.finalMode).toBe("skeptical_breakdown");
    }
  });

  it("keeps strong frontier follow-ups on conceptual_probe even with thread context", async () => {
    const result = await handleEvent(
      makeEvent({
        trigger_type: "reply",
        text: "what bottlenecks this architecture first?",
        parent_text: "We are comparing intake, scoring, and orchestration phases.",
        conversation_context: ["parent: architecture comparison"],
      }),
      makeDeps("The first bottleneck is usually the handoff between intake and scoring."),
      DEFAULT_CANONICAL_CONFIG,
    );

    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("neutral_clarification");
      expect(result.audit.classifier_output.intent).toBe("conceptual_probe");
      expect(result.audit.classifierIntent).toBe("conceptual_probe");
      expect(result.audit.baseIntent).toBe("conceptual_probe");
      expect(result.audit.sourceIntent).toBe("conceptual_probe");
      expect(result.audit.continuationSignal).toBeFalsy();
      expect(result.audit.finalMode).toBe("neutral_clarification");
    }
  });

  it("still skips the same reply-shaped follow-up without thread context", async () => {
    const result = await handleEvent(
      makeEvent({
        trigger_type: "reply",
        text: "and where does execution actually break here?",
      }),
      makeDeps("No thread context, no rescue."),
      DEFAULT_CANONICAL_CONFIG,
    );

    expect(result.action).toBe("skip");
    if (result.action === "skip") {
      expect(result.skip_reason).toBe("skip_low_confidence");
    }
  });

  it("publishes an explicit opt-in AI x crypto conceptual probe", async () => {
    const result = await handleEvent(
      makeEvent({ text: "@organoid_on_sol explicit opt-in: is AI x crypto actually structurally viable?" }),
      makeDeps("Viable only when the coordination layer is real and the constraints are explicit."),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.mode).toBe("neutral_clarification");
      expect(result.audit.classifier_output.intent).toBe("conceptual_probe");
      expect(result.audit.classifierIntent).toBe("conceptual_probe");
      expect(result.audit.baseIntent).toBe("conceptual_probe");
      expect(result.audit.sourceIntent).toBe("conceptual_probe");
      expect(result.audit.orchestrationEligibleMinimal).toBe(true);
      expect(result.audit.fastPathBypassReason).toBe("conceptual_probe_preempts_own_token_sentiment");
      expect(result.audit.finalMode).toBe("neutral_clarification");
      expect(result.audit).toHaveProperty("silencePolicy");
      expect(result.audit).toHaveProperty("renderPolicy");
    }
  });

  it("publishes a mention-prefixed greeting", async () => {
    const result = await handleEvent(
      makeEvent({ text: "@organoid_on_sol gm", cashtags: [] }),
      makeDeps("gm."),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.audit.classifier_output.intent).toBe("greeting");
      expect(result.audit.classifierIntent).toBe("greeting");
      expect(result.audit.final_action).toBe("publish");
      expect(result.audit.normalizedText).toBe("gm");
      expect(result.audit.strippedPrefixText).toBe("gm");
    }
  });

  it("publishes the technical-limits conceptual probe variant", async () => {
    const result = await handleEvent(
      makeEvent({ text: "what actually limits current LLM systems the most?" }),
      makeDeps("Mostly bottlenecks in data, evals, and deployment constraints."),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.audit.classifier_output.intent).toBe("conceptual_probe");
      expect(result.audit.classifierIntent).toBe("conceptual_probe");
      expect(result.audit.baseIntent).toBe("conceptual_probe");
      expect(result.audit.orchestrationEligibleMinimal).toBe(true);
      expect(result.audit.finalMode).toBe("neutral_clarification");
    }
  });

  it("publishes the transhuman merge conceptual probe variant", async () => {
    const result = await handleEvent(
      makeEvent({ text: "do you think humans merging with machines is inevitable?" }),
      makeDeps("Inevitable is too strong; the path is selective, constrained, and uneven."),
      DEFAULT_CANONICAL_CONFIG,
    );
    expect(result.action).toBe("publish");
    if (result.action === "publish") {
      expect(result.audit.classifier_output.intent).toBe("conceptual_probe");
      expect(result.audit.classifierIntent).toBe("conceptual_probe");
      expect(result.audit.baseIntent).toBe("conceptual_probe");
      expect(result.audit.orchestrationEligibleMinimal).toBe(true);
      expect(result.audit.finalMode).toBe("neutral_clarification");
    }
  });

  it("creates an audit record on publish", async () => {
    const result = await handleEvent(makeEvent(), makeDeps(), DEFAULT_CANONICAL_CONFIG);
    expect(result.action).toBe("publish");
    expect(result.audit).toBeTruthy();
    expect(result.audit.final_action).toBe("publish");
    expect(result.audit.reply_hash).toBeTruthy();
    expect(result.audit.normalizedText).toBeDefined();
    expect(result.audit.strippedPrefixText).toBeDefined();
  });

  it("creates an audit record on skip", async () => {
    const event = makeEvent({ text: "nice weather today" });
    const result = await handleEvent(event, makeDeps(), DEFAULT_CANONICAL_CONFIG);
    expect(result.action).toBe("skip");
    expect(result.audit).toBeTruthy();
    expect(result.audit.final_action).toBe("skip");
  });
});

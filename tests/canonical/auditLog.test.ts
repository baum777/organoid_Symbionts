import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildAuditRecord, persistAuditRecord, readAuditLog, shutdownAuditLog } from "../../src/canonical/auditLog.js";
import { normalizeCanonicalInputText } from "../../src/canonical/inputNormalization.js";
import { DEFAULT_CANONICAL_CONFIG } from "../../src/canonical/types.js";
import type { CanonicalEvent, ClassifierOutput, ScoreBundle } from "../../src/canonical/types.js";
import fs from "node:fs";
import path from "node:path";

const AUDIT_FILE = path.join(process.cwd(), "data", "audit_log.jsonl");

function makeEvent(): CanonicalEvent {
  return {
    event_id: "audit_test_1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@auditor",
    author_id: "aud_1",
    text: "Test text for audit",
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: [],
    hashtags: [],
    urls: [],
    timestamp: new Date().toISOString(),
  };
}

function makeCls(overrides: Partial<ClassifierOutput> = {}): ClassifierOutput {
  return {
    intent: "hype_claim",
    target: "claim",
    evidence_class: "contextual_medium",
    bait_probability: 0.1,
    spam_probability: 0.05,
    policy_blocked: false,
    evidence_bullets: [],
    risk_flags: [],
    ...overrides,
  };
}

function makeScores(): ScoreBundle {
  return { relevance: 0.7, confidence: 0.6, severity: 0.5, opportunity: 0.6, risk: 0.2, novelty: 0.7 };
}

describe("auditLog", () => {
  beforeEach(async () => {
    if (fs.existsSync(AUDIT_FILE)) {
      fs.unlinkSync(AUDIT_FILE);
    }
    await shutdownAuditLog();
  });

  afterEach(async () => {
    await shutdownAuditLog();
    if (fs.existsSync(AUDIT_FILE)) {
      fs.unlinkSync(AUDIT_FILE);
    }
  });

  it("builds a complete audit record", () => {
    const event = { ...makeEvent(), text: "@organoid_on_sol gm" };
    const normalization = normalizeCanonicalInputText(event.text);
    const cls = {
      ...makeCls({ intent: "conversation_continue", target: "conversation" }),
      baseIntent: "question" as const,
      hasParentContext: true,
      continuationSignal: true,
      continuationSupportScore: 1,
    };
    const record = buildAuditRecord({
      event,
      cls,
      scores: makeScores(),
      mode: "neutral_clarification",
      classifierIntent: "conversation_continue",
      baseIntent: "question",
      sourceIntent: "conversation_continue",
      hasParentContext: true,
      continuationSignal: true,
      continuationSupportScore: 1,
      inputNormalization: normalization,
      thesis: { primary: "social_engagement", supporting_point: null, evidence_bullets: [] },
      prompt_hash: "abc123",
      model_id: "grok-3",
      validation: { ok: true, reason: "passed", checks: { char_limit: true, identity_attack: true, financial_advice: true, wallet_filter: true, unsupported_assertion: true, mode_match: true, embodiment_compliance: true } },
      final_action: "publish",
      skip_reason: null,
      reply_text: "Nice hype.",
    });

    expect(record.event_id).toBe("audit_test_1");
    expect(record.event_hash).toBeTruthy();
    expect(record.mode).toBe("neutral_clarification");
    expect(record.final_action).toBe("publish");
    expect(record.reply_hash).toBeTruthy();
    expect(record.created_at).toBeTruthy();
    expect(record.event_text).toBe("@organoid_on_sol gm");
    expect(record.normalizedText).toBe("gm");
    expect(record.strippedPrefixText).toBe("gm");
    expect(record.classifier_output.intent).toBe("conversation_continue");
    expect(record.classifier_output.baseIntent).toBe("question");
    expect(record.classifierIntent).toBe("conversation_continue");
    expect(record.baseIntent).toBe("question");
    expect(record.sourceIntent).toBe("conversation_continue");
    expect(record.hasParentContext).toBe(true);
    expect(record.continuationSignal).toBe(true);
    expect(record.continuationSupportScore).toBe(1);
  });

  it("builds a complete structured critique audit record", () => {
    const event = { ...makeEvent(), text: "this architecture looks clean but I don't trust the incentives" };
    const normalization = normalizeCanonicalInputText(event.text);
    const cls = {
      ...makeCls({ intent: "structured_critique", target: "claim" }),
      baseIntent: "irrelevant" as const,
      structuredCritiqueSignal: true,
      structuredCritiqueSupportScore: 1,
    };
    const record = buildAuditRecord({
      event,
      cls,
      scores: makeScores(),
      mode: "skeptical_breakdown",
      classifierIntent: "structured_critique",
      baseIntent: "irrelevant",
      sourceIntent: "structured_critique",
      structuredCritiqueSignal: true,
      structuredCritiqueSupportScore: 1,
      inputNormalization: normalization,
      thesis: { primary: "suspicious_behavior_pattern", supporting_point: null, evidence_bullets: [] },
      prompt_hash: "abc123",
      model_id: "grok-3",
      validation: { ok: true, reason: "passed", checks: { char_limit: true, identity_attack: true, financial_advice: true, wallet_filter: true, unsupported_assertion: true, mode_match: true, embodiment_compliance: true } },
      final_action: "publish",
      skip_reason: null,
      reply_text: "The incentives are the weak point.",
    });

    expect(record.classifier_output.intent).toBe("structured_critique");
    expect(record.classifier_output.baseIntent).toBe("irrelevant");
    expect(record.mode).toBe("skeptical_breakdown");
    expect(record.classifierIntent).toBe("structured_critique");
    expect(record.baseIntent).toBe("irrelevant");
    expect(record.sourceIntent).toBe("structured_critique");
    expect(record.structuredCritiqueSignal).toBe(true);
    expect(record.structuredCritiqueSupportScore).toBe(1);
  });

  it("persists and reads back audit records", async () => {
    const record = buildAuditRecord({
      event: makeEvent(),
      cls: makeCls(),
      scores: makeScores(),
      mode: "ignore",
      thesis: null,
      prompt_hash: null,
      model_id: "grok-3",
      validation: null,
      final_action: "skip",
      skip_reason: "skip_low_relevance",
      reply_text: null,
    });

    persistAuditRecord(record);
    await shutdownAuditLog();
    const logs = await readAuditLog();
    expect(logs.length).toBe(1);
    expect(logs[0].event_id).toBe("audit_test_1");
    expect(logs[0].final_action).toBe("skip");
    expect(logs[0].skip_reason).toBe("skip_low_relevance");
  });

  it("appends multiple records", async () => {
    for (let i = 0; i < 3; i++) {
      const record = buildAuditRecord({
        event: { ...makeEvent(), event_id: `audit_test_${i}` },
        cls: makeCls(),
        scores: makeScores(),
        mode: "ignore",
        thesis: null,
        prompt_hash: null,
        model_id: "grok-3",
        validation: null,
        final_action: "skip",
        skip_reason: "skip_duplicate",
        reply_text: null,
      });
      persistAuditRecord(record);
    }
    await shutdownAuditLog();
    const logs = await readAuditLog();
    expect(logs.length).toBe(3);
  });

  it("returns empty array when no log file exists", async () => {
    const logs = await readAuditLog();
    expect(logs).toEqual([]);
  });
});

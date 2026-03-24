/**
 * Embodiment Selector Tests — Fallback to configured safe embodiment when disabled
 */

import { describe, it, expect, beforeEach } from "vitest";
import { clearRegistry } from "../../src/embodiments/registry.js";
import { loadEmbodiments } from "../../src/embodiments/loadEmbodiments.js";
import { selectEmbodiment } from "../../src/routing/embodimentSelector.js";
import { extractSelectorFeatures } from "../../src/routing/selectorFeatures.js";
import type { ClassifierOutput, ScoreBundle } from "../../src/canonical/types.js";
import type { CanonicalEvent } from "../../src/canonical/types.js";

function makeEvent(overrides?: Partial<CanonicalEvent>): CanonicalEvent {
  return {
    event_id: "ev_1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "user1",
    author_id: "123",
    text: "hello embodiments",
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

function makeClassifier(overrides?: Partial<ClassifierOutput>): ClassifierOutput {
  return {
    intent: "greeting",
    target: "conversation",
    evidence_class: "contextual_medium",
    bait_probability: 0.1,
    spam_probability: 0,
    policy_blocked: false,
    evidence_bullets: [],
    risk_flags: [],
    ...overrides,
  };
}

const defaultScores: ScoreBundle = {
  relevance: 0.7,
  confidence: 0.8,
  severity: 0.3,
  opportunity: 0.5,
  risk: 0.2,
  novelty: 0.4,
};

describe("Embodiment Selector", () => {
  beforeEach(async () => {
    clearRegistry();
    await loadEmbodiments();
  });

  it("returns configured safe embodiment when EMBODIMENTS_ENABLED=false", () => {
    const features = extractSelectorFeatures(
      makeClassifier(),
      defaultScores,
      makeEvent(),
    );
    const result = selectEmbodiment(features, "social_banter", {
      enabled: false,
      defaultSafeEmbodiment: "stillhalter",
    });
    expect(result.selectedEmbodimentId).toBe("stillhalter");
    expect(result.reasoning).toContain("embodiments_disabled_or_empty");
  });

  it("returns a loaded embodiment when enabled", () => {
    const features = extractSelectorFeatures(
      makeClassifier(),
      defaultScores,
      makeEvent(),
    );
    const result = selectEmbodiment(features, "social_banter", {
      enabled: true,
      defaultSafeEmbodiment: "stillhalter",
    });
    expect(result.selectedEmbodimentId.length).toBeGreaterThan(0);
  });

  it("includes responseMode in result", () => {
    const features = extractSelectorFeatures(
      makeClassifier(),
      defaultScores,
      makeEvent(),
    );
    const result = selectEmbodiment(features, "lore_drop", { enabled: true });
    expect(result.responseMode).toBe("lore_drop");
  });

  it("routes social banter toward Nebelspieler when the mode and energy fit", () => {
    const features = extractSelectorFeatures(
      makeClassifier({ intent: "conversation_continue" }),
      defaultScores,
      makeEvent(),
      { marketEnergy: "HIGH" },
    );
    const result = selectEmbodiment(features, "social_banter", { enabled: true });
    expect(result.selectedEmbodimentId).toBe("nebelspieler");
  });

  it("keeps Nebelspieler out of hard caution even when the thread is lively", () => {
    const features = extractSelectorFeatures(
      makeClassifier({ intent: "conversation_continue" }),
      defaultScores,
      makeEvent(),
      { marketEnergy: "HIGH" },
    );
    const result = selectEmbodiment(features, "hard_caution", { enabled: true });
    expect(result.selectedEmbodimentId).toBe("muenzhueter");
    expect(result.selectedEmbodimentId).not.toBe("nebelspieler");
  });
});

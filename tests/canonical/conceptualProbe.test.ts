import { describe, expect, it } from "vitest";
import { classify } from "../../src/canonical/classifier.js";
import { scoreEvent } from "../../src/canonical/scorer.js";
import { isConceptualProbe, hasFrontierDomainSignal, hasMarketClusterSignal, isOrchestrationEligibleMinimal } from "../../src/canonical/conceptualProbe.js";
import type { CanonicalEvent } from "../../src/canonical/types.js";

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: "conceptual_1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@tester",
    author_id: "u1",
    text: "what are wetware computers actually good for?",
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

describe("conceptual probe helpers", () => {
  it("detects frontier structure and conceptual probes", () => {
    const event = makeEvent({ text: "how do crypto, AI, and wetware converge long term?" });
    expect(hasFrontierDomainSignal(event.text)).toBe(true);
    expect(isConceptualProbe(event.text, { event })).toBe(true);
  });

  it("rejects generic smalltalk and declarative hype", () => {
    expect(isConceptualProbe("gm how's your day")).toBe(false);
    expect(isConceptualProbe("AI will replace all humans within 5 years")).toBe(false);
  });

  it("detects real market clusters without overfitting generic market words", () => {
    expect(hasMarketClusterSignal("what's the price action and liquidity like?")).toBe(true);
    expect(hasMarketClusterSignal("how do crypto, AI, and wetware converge long term?")).toBe(false);
  });

  it("marks rescued conceptual probes as orchestration eligible", () => {
    const event = makeEvent({ text: "@organoid_on_sol explicit opt-in: is AI x crypto actually structurally viable?" });
    const cls = classify(event);
    const scores = scoreEvent(event, cls);
    expect(cls.intent).toBe("conceptual_probe");
    expect(isOrchestrationEligibleMinimal({ event, cls, scores })).toBe(true);
  });
});

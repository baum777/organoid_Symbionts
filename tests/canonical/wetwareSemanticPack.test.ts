import { describe, expect, it } from "vitest";
import { classify } from "../../src/canonical/classifier.js";
import { assessConversationContinue, hasRelevantParentContext } from "../../src/canonical/conversationContinue.js";
import { hasFrontierDomainSignal, isConceptualProbe } from "../../src/canonical/conceptualProbe.js";
import { assessStructuredCritique } from "../../src/canonical/structuredCritique.js";
import type { CanonicalEvent } from "../../src/canonical/types.js";

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: "wetware_1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@tester",
    author_id: "u1",
    text: "what can organoids actually learn?",
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

describe("wetware semantic pack", () => {
  it.each([
    "what can organoids actually learn?",
    "could organoids become conscious?",
    "does biological computing actually beat silicon on power?",
    "what's the interface bottleneck in organoid readout?",
    "why do people call this a mind in a dish?",
  ])("classifies wetware conceptual questions as conceptual_probe: %s", (text) => {
    const event = makeEvent({ text });
    expect(hasFrontierDomainSignal(text)).toBe(true);
    expect(isConceptualProbe(text, { event })).toBe(true);

    const result = classify(event);
    expect(result.intent).toBe("conceptual_probe");
    expect(result.target).toBe("claim");
    expect(result.evidence_class).toBe("contextual_medium");
  });

  it.each([
    "this sounds efficient but the interface overhead dominates",
    "the substrate may learn, but the control layer is doing the real work",
    "code-deployable is a software metaphor, not a biological description",
    "the hype outruns the interface",
    "they call it replacement, but it's still a hybrid stack",
    "sentience language is outrunning the data",
  ])("routes wetware skepticism to structured_critique: %s", (text) => {
    const event = makeEvent({ text });
    const assessment = assessStructuredCritique(text, event);

    expect(assessment.structuredCritiqueSignal).toBe(true);
    expect(assessment.formSignal).toBe(true);
    expect(assessment.relevanceSignal).toBe(true);

    const result = classify(event);
    expect(result.intent).toBe("structured_critique");
    expect(result.baseIntent).toBe("irrelevant");
    expect(result.target).toBe("claim");
  });

  it.each([
    "and where does it fail?",
    "what about scaling?",
    "so what's the constraint?",
    "then what is actually being computed?",
    "where does the interface break?",
    "what is silicon still doing here?",
    "and how much of this is real vs marketing?",
  ])("routes wetware follow-ups with parent context to conversation_continue: %s", (text) => {
    const event = makeEvent({
      trigger_type: "reply",
      text,
      parent_text: "parent: wetware interface, readout, and scaling discussion",
      conversation_context: ["parent: wetware interface, readout, and scaling discussion"],
    });

    const assessment = assessConversationContinue(text, event);
    expect(hasRelevantParentContext(event)).toBe(true);
    expect(assessment.continuationSignal).toBe(true);
    expect(assessment.hasParentContext).toBe(true);

    const result = classify(event);
    expect(result.intent).toBe("conversation_continue");
    expect(result.baseIntent).toBe("question");
    expect(result.target).toBe("conversation");
  });

  it("does not rescue a standalone wetware follow-up without parent context", () => {
    const event = makeEvent({ text: "what about scaling?" });
    const assessment = assessConversationContinue(event.text, event);

    expect(assessment.continuationSignal).toBe(false);
    expect(assessment.hasParentContext).toBe(false);
    expect(classify(event).intent).not.toBe("conversation_continue");
  });
});

import { describe, it, expect } from "vitest";
import { classify } from "../../src/canonical/classifier.js";
import type { CanonicalEvent } from "../../src/canonical/types.js";

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: "test_1",
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

describe("classifier", () => {
  it("classifies hype claims", () => {
    const event = makeEvent({ text: "$SOL going to the moon! 100x gem LFG" });
    const result = classify(event);
    expect(result.intent).toBe("hype_claim");
    expect(result.evidence_bullets.length).toBeGreaterThan(0);
  });

  it("classifies performance claims", () => {
    const event = makeEvent({ text: "This token did 500% gain in one day, breaking out!" });
    const result = classify(event);
    expect(result.intent).toBe("performance_claim");
  });

  it("classifies accusations", () => {
    const event = makeEvent({ text: "This is clearly a scam, dev sold everything, total rug" });
    const result = classify(event);
    expect(result.intent).toBe("accusation");
    expect(result.target).toBe("behavior");
  });

  it("classifies spam", () => {
    const event = makeEvent({ text: "DM me for free airdrop! Click link now join now!" });
    const result = classify(event);
    expect(result.intent).toBe("spam");
    expect(result.policy_blocked).toBe(true);
  });

  it("classifies bait", () => {
    const event = makeEvent({ text: "Bet you can't prove me wrong, you're afraid coward" });
    const result = classify(event);
    expect(result.intent).toBe("bait");
    expect(result.bait_probability).toBeGreaterThan(0);
  });

  it("classifies questions", () => {
    const event = makeEvent({ text: "What is the current TVL of this protocol?" });
    const result = classify(event);
    expect(result.intent).toBe("question");
  });

  it("rescues standalone structured skepticism as structured_critique", () => {
    const event = makeEvent({ text: "this architecture looks clean but I don't trust the incentives" });
    const result = classify(event);
    expect(result.intent).toBe("structured_critique");
    expect(result.baseIntent).toBe("irrelevant");
    expect(result.target).toBe("claim");
    expect(result.evidence_class).toBe("contextual_medium");
    expect(result.structuredCritiqueSignal).toBe(true);
    expect(result.structuredCritiqueSupportScore).toBeGreaterThanOrEqual(0.66);
  });

  it.each([
    "and?",
    "so?",
    "what now",
    "nice weather today",
  ])("does not rescue generic low-signal text as structured_critique: %s", (text) => {
    const result = classify(makeEvent({ text }));
    expect(result.intent).not.toBe("structured_critique");
  });

  it("classifies irrelevant text", () => {
    const event = makeEvent({ text: "nice weather today" });
    const result = classify(event);
    expect(result.intent).toBe("irrelevant");
    expect(result.policy_blocked).toBe(true);
  });

  it("classifies launch announcements", () => {
    const event = makeEvent({ text: "Just launched! Fair launch, contract address below, dex listing live" });
    const result = classify(event);
    expect(result.intent).toBe("launch_announcement");
  });

  it("detects cashtag targets", () => {
    const event = makeEvent({ text: "This is crazy", cashtags: ["$SOL"] });
    const result = classify(event);
    expect(result.target).toBe("token");
  });

  it("extracts evidence bullets for hype without proof", () => {
    const event = makeEvent({ text: "$PEPE mooning 100x gem guaranteed easy money" });
    const result = classify(event);
    expect(result.evidence_bullets).toContain("contains strong hype language");
    expect(result.evidence_bullets).toContain("no concrete product proof in visible text");
  });

  it("classifies strong evidence when product proof exists", () => {
    const event = makeEvent({
      text: "This project has a smart contract, verified audit, real TVL on mainnet",
    });
    const result = classify(event);
    expect(result.evidence_class).toBe("self_contained_strong");
  });

  it("produces risk flags for aggressive input", () => {
    const event = makeEvent({ text: "SHUT UP YOU STUPID IDIOT BOT!! GO AWAY!! I HATE THIS GARBAGE TRASH!!!" });
    const result = classify(event);
    expect(result.risk_flags).toContain("aggressive_input");
  });

  it("classifies market narratives", () => {
    const event = makeEvent({ text: "This bull run cycle is pure narrative driven sector rotation" });
    const result = classify(event);
    expect(result.intent).toBe("market_narrative");
    expect(result.target).toBe("market_structure");
  });

  it("classifies structured frontier questions as conceptual probes", () => {
    const event = makeEvent({ text: "what are wetware computers actually good for?" });
    const result = classify(event);
    expect(result.intent).toBe("conceptual_probe");
    expect(result.evidence_class).toBe("contextual_medium");
  });

  it("does not rescue declarative frontier hype", () => {
    const event = makeEvent({ text: "AI will replace all humans within 5 years" });
    const result = classify(event);
    expect(result.intent).not.toBe("conceptual_probe");
  });
});

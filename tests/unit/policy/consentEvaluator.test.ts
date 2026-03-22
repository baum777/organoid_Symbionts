import { describe, expect, it } from "vitest";
import { evaluateConsent } from "../../../src/engagement/consentEvaluator.js";

describe("consentEvaluator", () => {
  it("fails closed for search-derived signals", () => {
    const result = evaluateConsent({
      isDirectMention: false,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: false,
      hasOptOut: false,
      priorInteraction: false,
      isSearchDerived: true,
    });

    expect(result.state).toBe("NONE");
    expect(result.allowCandidate).toBe(false);
    expect(result.reason).toBe("NO_SIGNAL");
  });

  it("lets explicit opt-in win unless opt-out is present", () => {
    const approved = evaluateConsent({
      isDirectMention: false,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: true,
      hasOptOut: false,
      priorInteraction: false,
      isSearchDerived: false,
    });

    expect(approved.state).toBe("EXPLICIT");
    expect(approved.allowCandidate).toBe(true);

    const denied = evaluateConsent({
      isDirectMention: true,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: true,
      hasOptOut: true,
      priorInteraction: true,
      isSearchDerived: false,
    });

    expect(denied.state).toBe("OPTOUT");
    expect(denied.allowCandidate).toBe(false);
    expect(denied.reason).toBe("OPTOUT_PRESENT");
  });

  it("treats direct interaction as candidate eligible", () => {
    const result = evaluateConsent({
      isDirectMention: true,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: false,
      hasOptOut: false,
      priorInteraction: false,
      isSearchDerived: false,
    });

    expect(result.state).toBe("INTERACTION_BASED");
    expect(result.allowCandidate).toBe(true);
    expect(result.reason).toBe("DIRECT_INTERACTION");
  });

  it("keeps prior interaction only as weak context", () => {
    const result = evaluateConsent({
      isDirectMention: false,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: false,
      hasOptOut: false,
      priorInteraction: true,
      isSearchDerived: false,
    });

    expect(result.state).toBe("WEAK_CONTEXT");
    expect(result.allowCandidate).toBe(false);
    expect(result.reason).toBe("WEAK_CONTEXT_ONLY");
  });
});

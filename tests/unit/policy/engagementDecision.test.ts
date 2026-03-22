import { describe, expect, it } from "vitest";
import { decideEngagement } from "../../../src/engagement/engagementDecision.js";
import { evaluateConsent } from "../../../src/engagement/consentEvaluator.js";
import { evaluateEnergy } from "../../../src/engagement/energyEvaluator.js";

function explicitConsent() {
  return evaluateConsent({
    isDirectMention: false,
    isReplyToBot: false,
    isQuoteOfBot: false,
    hasExplicitOptIn: true,
    hasOptOut: false,
    priorInteraction: false,
    isSearchDerived: false,
  });
}

function interactionConsent() {
  return evaluateConsent({
    isDirectMention: true,
    isReplyToBot: false,
    isQuoteOfBot: false,
    hasExplicitOptIn: false,
    hasOptOut: false,
    priorInteraction: false,
    isSearchDerived: false,
  });
}

const strongEnergy = evaluateEnergy({
  directness: 4,
  intent: 4,
  relevance: 4,
  freshness: 4,
  legitimacy: 4,
  friction: 0,
});

const mediumEnergy = evaluateEnergy({
  directness: 3,
  intent: 3,
  relevance: 3,
  freshness: 3,
  legitimacy: 3,
  friction: 0,
});

describe("engagementDecision", () => {
  it("blocks invalid auth first", () => {
    const result = decideEngagement({
      consent: explicitConsent(),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: false,
      aiApproval: true,
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.reason).toBe("AUTH_INVALID");
  });

  it("blocks missing AI approval first", () => {
    const result = decideEngagement({
      consent: explicitConsent(),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: false,
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.reason).toBe("AI_APPROVAL_MISSING");
  });

  it("keeps opt-out absolute", () => {
    const result = decideEngagement({
      consent: evaluateConsent({
        isDirectMention: true,
        isReplyToBot: false,
        isQuoteOfBot: false,
        hasExplicitOptIn: true,
        hasOptOut: true,
        priorInteraction: false,
        isSearchDerived: false,
      }),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.reason).toBe("OPTOUT_PRESENT");
  });

  it("skips already handled interactions", () => {
    const result = decideEngagement({
      consent: interactionConsent(),
      energy: strongEnergy,
      alreadyReplied: true,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("SKIP");
    expect(result.reason).toBe("ALREADY_REPLIED");
  });

  it("holds when budget is exhausted", () => {
    const result = decideEngagement({
      consent: explicitConsent(),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: false,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("HOLD");
    expect(result.reason).toBe("NO_WRITE_BUDGET");
  });

  it("reviews medium energy for interaction-based consent", () => {
    const result = decideEngagement({
      consent: interactionConsent(),
      energy: mediumEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("REVIEW");
    expect(result.reason).toBe("REVIEW_REQUIRED");
  });

  it("engages only with explicit consent and valid runtime gates", () => {
    const result = decideEngagement({
      consent: explicitConsent(),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("ENGAGE");
    expect(result.reason).toBe("ENGAGE_STRONG_CONSENT");
  });

  it("never lets energy override missing consent", () => {
    const result = decideEngagement({
      consent: evaluateConsent({
        isDirectMention: false,
        isReplyToBot: false,
        isQuoteOfBot: false,
        hasExplicitOptIn: false,
        hasOptOut: false,
        priorInteraction: false,
        isSearchDerived: true,
      }),
      energy: strongEnergy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    expect(result.decision).toBe("SKIP");
    expect(result.reason).toBe("NO_CONSENT");
  });
});

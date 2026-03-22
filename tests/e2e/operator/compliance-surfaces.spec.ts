import { beforeEach, describe, expect, it } from "vitest";
import { getSnapshot, resetMetrics } from "../../../src/observability/metrics.js";
import { recordConsentDecision, recordEngagementDecision } from "../../../src/engagement/complianceMetrics.js";
import { evaluateConsent } from "../../../src/engagement/consentEvaluator.js";
import { evaluateEnergy } from "../../../src/engagement/energyEvaluator.js";
import { decideEngagement } from "../../../src/engagement/engagementDecision.js";

describe("compliance surfaces", () => {
  beforeEach(() => {
    resetMetrics();
  });

  it("exposes no-consent as a skip reason in metrics", () => {
    const consent = evaluateConsent({
      isDirectMention: false,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: false,
      hasOptOut: false,
      priorInteraction: false,
      isSearchDerived: true,
    });
    const energy = evaluateEnergy({
      directness: 0,
      intent: 0,
      relevance: 0,
      freshness: 0,
      legitimacy: 0,
      friction: 0,
    });
    const decision = decideEngagement({
      consent,
      energy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    recordConsentDecision(consent);
    recordEngagementDecision(decision, consent, energy);

    const snapshot = getSnapshot();
    expect(snapshot.counters.engagement_decision_skip_no_consent_total).toBeGreaterThan(0);
  });

  it("surfaces opt-out as a hard block", () => {
    const consent = evaluateConsent({
      isDirectMention: true,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: true,
      hasOptOut: true,
      priorInteraction: false,
      isSearchDerived: false,
    });
    const energy = evaluateEnergy({
      directness: 4,
      intent: 4,
      relevance: 4,
      freshness: 4,
      legitimacy: 4,
      friction: 0,
    });
    const decision = decideEngagement({
      consent,
      energy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: true,
    });

    recordConsentDecision(consent);
    recordEngagementDecision(decision, consent, energy);

    const snapshot = getSnapshot();
    expect(snapshot.counters.engagement_decision_block_optout_total).toBeGreaterThan(0);
  });

  it("surfaces AI approval missing as a hard block", () => {
    const consent = evaluateConsent({
      isDirectMention: true,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: false,
      hasOptOut: false,
      priorInteraction: false,
      isSearchDerived: false,
    });
    const energy = evaluateEnergy({
      directness: 4,
      intent: 4,
      relevance: 4,
      freshness: 4,
      legitimacy: 4,
      friction: 0,
    });
    const decision = decideEngagement({
      consent,
      energy,
      alreadyReplied: false,
      hasWriteBudget: true,
      authValid: true,
      aiApproval: false,
    });

    recordConsentDecision(consent);
    recordEngagementDecision(decision, consent, energy);

    const snapshot = getSnapshot();
    expect(snapshot.counters.engagement_decision_block_ai_approval_missing_total).toBeGreaterThan(0);
  });
});

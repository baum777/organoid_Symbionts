import { beforeEach, describe, expect, it } from "vitest";
import { getSnapshot, resetMetrics } from "../../../src/observability/metrics.js";
import { recordEngagementDecision } from "../../../src/engagement/complianceMetrics.js";
import { evaluateConsent } from "../../../src/engagement/consentEvaluator.js";
import { evaluateEnergy } from "../../../src/engagement/energyEvaluator.js";
import { decideEngagement } from "../../../src/engagement/engagementDecision.js";

describe("blocked write observability", () => {
  beforeEach(() => {
    resetMetrics();
  });

  it("increments a skip counter and keeps write side effects absent when consent is missing", () => {
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
      directness: 1,
      intent: 1,
      relevance: 1,
      freshness: 1,
      legitimacy: 1,
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

    recordEngagementDecision(decision, consent, energy);

    const snapshot = getSnapshot();
    expect(snapshot.counters.engagement_decision_skip_no_consent_total).toBeGreaterThan(0);
    expect(snapshot.counters.engagement_decision_engage_total).toBe(0);
    expect(snapshot.counters.engagement_decision_review_total).toBe(0);
  });

  it("marks no-budget candidates as hold and does not escalate to write", () => {
    const consent = evaluateConsent({
      isDirectMention: true,
      isReplyToBot: false,
      isQuoteOfBot: false,
      hasExplicitOptIn: true,
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
      hasWriteBudget: false,
      authValid: true,
      aiApproval: true,
    });

    recordEngagementDecision(decision, consent, energy);

    const snapshot = getSnapshot();
    expect(snapshot.counters.engagement_decision_hold_no_budget_total).toBeGreaterThan(0);
    expect(snapshot.counters.engagement_decision_engage_total).toBe(0);
  });
});

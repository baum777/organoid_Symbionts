import { incrementCounter } from "../observability/metrics.js";
import { COUNTER_NAMES } from "../observability/metricTypes.js";
import type { DecisionResult } from "./engagementDecision.js";
import type { ConsentResult } from "./consentEvaluator.js";
import type { EnergyScore } from "./energyEvaluator.js";

export function recordConsentDecision(consent: ConsentResult): void {
  if (consent.state === "OPTOUT") {
    incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_OPTOUT_TOTAL);
    return;
  }

  if (consent.state === "BLOCKED") {
    incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_POLICY_TOTAL);
  }
}

export function recordEngagementDecision(
  decision: DecisionResult,
  consent: ConsentResult,
  energy?: EnergyScore,
): void {
  switch (decision.reason) {
    case "AUTH_INVALID":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_AUTH_INVALID_TOTAL);
      return;
    case "AI_APPROVAL_MISSING":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_AI_APPROVAL_MISSING_TOTAL);
      return;
    case "BLOCKED_BY_POLICY":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_POLICY_TOTAL);
      return;
    case "OPTOUT_PRESENT":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_BLOCK_OPTOUT_TOTAL);
      return;
    case "ALREADY_REPLIED":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_ALREADY_REPLIED_TOTAL);
      return;
    case "NO_CONSENT":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_NO_CONSENT_TOTAL);
      return;
    case "NO_WRITE_BUDGET":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_HOLD_NO_BUDGET_TOTAL);
      return;
    case "TARGET_MISSING":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_TARGET_MISSING_TOTAL);
      return;
    case "DEAD_SIGNAL":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_NO_CONSENT_TOTAL);
      return;
    case "LOW_ENERGY":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_HOLD_LOW_ENERGY_TOTAL);
      return;
    case "REVIEW_REQUIRED":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_REVIEW_TOTAL);
      return;
    case "ENGAGE_VALID_CONSENT":
    case "ENGAGE_STRONG_CONSENT":
      incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_ENGAGE_TOTAL);
      return;
    default:
      if (decision.decision === "ENGAGE") {
        incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_ENGAGE_TOTAL);
      } else if (decision.decision === "REVIEW") {
        incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_REVIEW_TOTAL);
      } else if (decision.decision === "HOLD") {
        incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_HOLD_LOW_ENERGY_TOTAL);
      } else if (decision.decision === "SKIP") {
        incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_NO_CONSENT_TOTAL);
      }
      return;
  }
}

export function recordEnergyBand(energy: EnergyScore): void {
  if (energy.band === "E1") {
    incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_HOLD_LOW_ENERGY_TOTAL);
  } else if (energy.band === "E0") {
    incrementCounter(COUNTER_NAMES.ENGAGEMENT_DECISION_SKIP_NO_CONSENT_TOTAL);
  }
}

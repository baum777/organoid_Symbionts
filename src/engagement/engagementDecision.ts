import type { ConsentResult } from "./consentEvaluator.js";
import type { EnergyScore } from "./energyEvaluator.js";

export type EngagementDecision = "SKIP" | "HOLD" | "REVIEW" | "ENGAGE" | "BLOCK";

export type DecisionReason =
  | "AUTH_INVALID"
  | "AI_APPROVAL_MISSING"
  | "BLOCKED_BY_POLICY"
  | "OPTOUT_PRESENT"
  | "ALREADY_REPLIED"
  | "NO_CONSENT"
  | "NO_WRITE_BUDGET"
  | "TARGET_MISSING"
  | "DEAD_SIGNAL"
  | "LOW_ENERGY"
  | "REVIEW_REQUIRED"
  | "ENGAGE_VALID_CONSENT"
  | "ENGAGE_STRONG_CONSENT";

export type DecisionInput = {
  consent: ConsentResult;
  energy: EnergyScore;
  alreadyReplied: boolean;
  hasWriteBudget: boolean;
  authValid: boolean;
  aiApproval: boolean;
};

export type DecisionResult = {
  decision: EngagementDecision;
  reason: DecisionReason;
};

export function decideEngagement(input: DecisionInput): DecisionResult {
  if (!input.authValid) {
    return { decision: "BLOCK", reason: "AUTH_INVALID" };
  }

  if (!input.aiApproval) {
    return { decision: "BLOCK", reason: "AI_APPROVAL_MISSING" };
  }

  if (input.consent.state === "BLOCKED") {
    return { decision: "BLOCK", reason: "BLOCKED_BY_POLICY" };
  }

  if (input.consent.state === "OPTOUT") {
    return { decision: "BLOCK", reason: "OPTOUT_PRESENT" };
  }

  if (input.alreadyReplied) {
    return { decision: "SKIP", reason: "ALREADY_REPLIED" };
  }

  if (!input.consent.allowCandidate) {
    return { decision: "SKIP", reason: "NO_CONSENT" };
  }

  if (!input.hasWriteBudget) {
    return { decision: "HOLD", reason: "NO_WRITE_BUDGET" };
  }

  switch (input.energy.band) {
    case "E0":
      return { decision: "SKIP", reason: "DEAD_SIGNAL" };
    case "E1":
      return { decision: "HOLD", reason: "LOW_ENERGY" };
    case "E2":
      return input.consent.state === "EXPLICIT"
        ? { decision: "ENGAGE", reason: "ENGAGE_VALID_CONSENT" }
        : { decision: "REVIEW", reason: "REVIEW_REQUIRED" };
    case "E3":
      return input.consent.state === "EXPLICIT"
        ? { decision: "ENGAGE", reason: "ENGAGE_STRONG_CONSENT" }
        : { decision: "REVIEW", reason: "REVIEW_REQUIRED" };
    default:
      return { decision: "SKIP", reason: "DEAD_SIGNAL" };
  }
}

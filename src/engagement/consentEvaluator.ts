export type ConsentState =
  | "NONE"
  | "WEAK_CONTEXT"
  | "INTERACTION_BASED"
  | "EXPLICIT"
  | "OPTOUT"
  | "BLOCKED";

export type ConsentReason =
  | "NO_SIGNAL"
  | "WEAK_CONTEXT_ONLY"
  | "DIRECT_INTERACTION"
  | "EXPLICIT_OPT_IN"
  | "OPTOUT_PRESENT"
  | "BLOCKED_BY_POLICY";

export type ConsentInput = {
  isDirectMention: boolean;
  isReplyToBot: boolean;
  isQuoteOfBot: boolean;
  hasExplicitOptIn: boolean;
  hasOptOut: boolean;
  priorInteraction: boolean;
  isSearchDerived: boolean;
  blockedByPolicy?: boolean;
};

export type ConsentResult = {
  state: ConsentState;
  allowCandidate: boolean;
  reason: ConsentReason;
};

export function evaluateConsent(input: ConsentInput): ConsentResult {
  if (input.hasOptOut) {
    return {
      state: "OPTOUT",
      allowCandidate: false,
      reason: "OPTOUT_PRESENT",
    };
  }

  if (input.blockedByPolicy) {
    return {
      state: "BLOCKED",
      allowCandidate: false,
      reason: "BLOCKED_BY_POLICY",
    };
  }

  if (input.hasExplicitOptIn) {
    return {
      state: "EXPLICIT",
      allowCandidate: true,
      reason: "EXPLICIT_OPT_IN",
    };
  }

  if (input.isDirectMention || input.isReplyToBot || input.isQuoteOfBot) {
    return {
      state: "INTERACTION_BASED",
      allowCandidate: true,
      reason: "DIRECT_INTERACTION",
    };
  }

  if (input.priorInteraction && !input.isSearchDerived) {
    return {
      state: "WEAK_CONTEXT",
      allowCandidate: false,
      reason: "WEAK_CONTEXT_ONLY",
    };
  }

  return {
    state: "NONE",
    allowCandidate: false,
    reason: "NO_SIGNAL",
  };
}

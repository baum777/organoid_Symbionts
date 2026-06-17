// Request/response contract for the /api/consult endpoint.
// Sourced from docs/landing-practice-route.md § 7 and
// docs/methodology/coaching-contexts.md § 6.

import type {
  ConsultContext,
  ConsultLocale,
  ConsultPosture,
  ConsultStatus,
} from "@/lib/consult/constants";

export type ConsultRequest = {
  signal: string;
  context: ConsultContext;
  posture: ConsultPosture;
  locale: ConsultLocale;
};

export type ConsultVoice = {
  id: string;
  glyph: string;
  name: string;
  classical: string;
  answer: string;
  blockedReason?: string;
};

export type ConsultValidation = {
  passed: boolean;
  mode: string;
  budgetChars: number;
  actualChars: number;
};

export type ConsultEvidence = {
  signalHash: string;
  seed: string;
  modelVersion: string;
};

export type ConsultResponse = {
  requestId: string;
  phase: string;
  phaseConfidence: number;
  lead: ConsultVoice;
  counterweight: ConsultVoice | null;
  anchor: ConsultVoice | null;
  echo: ConsultVoice | null;
  suppressor: ConsultVoice | null;
  validation: ConsultValidation;
  evidence: ConsultEvidence;
};

export type ConsultError = {
  error: string;
  requestId?: string;
  reasons?: string[];
  maxChars?: number;
  retryAfter?: number;
};

export type ConsultErrorBody =
  | { error: "signal_too_long"; maxChars: number }
  | { error: "signal_too_short"; minChars: number }
  | { error: "invalid_context" }
  | { error: "invalid_posture" }
  | { error: "invalid_locale" }
  | { error: "validation_failed"; reasons: string[] }
  | { error: "rate_limited"; retryAfter: number }
  | { error: "internal"; requestId: string };

// Re-export the client status union so server and client share it
// without importing from the page module. This is the single
// canonical home of the four-state machine used across the
// consult surface and the /api/consult route.
export type { ConsultStatus };

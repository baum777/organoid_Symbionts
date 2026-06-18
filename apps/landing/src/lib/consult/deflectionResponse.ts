// Static deflection responses for the clinical-topic guard.
//
// Each GuardCategory maps to a ConsultResponse whose lead.answer
// is a fixed, compliance-reviewed string. The response has
// validation.passed = false and a deflection mode name so the
// client and observability layer can distinguish it from a real
// consult answer.
//
// Voice assignments:
//   crisis       → Stabil-Core (■) — stable presence before referral
//   clinical     → Stabil-Core (■) — holds the boundary clearly
//   out_of_scope → Stabil-Core (■) — same; boundary-holder
//   moderation   → Stabil-Core (■) — brief refusal, no elaboration
//
// DE text is primary. EN text is secondary (Phase 3 i18n).
// Crisis resources: Telefonseelsorge 0800 111 0 111 (DE, free, 24h)
// and findahelpline.com (international).

import type { GuardCategory } from "@/lib/consult/clinicalGuard";
import type { ConsultLocale } from "@/lib/consult/constants";
import type { ConsultResponse, ConsultVoice } from "@/lib/consult/types";

const STABIL_CORE_VOICE = {
  id: "stabil-core",
  glyph: "■",
  name: "Stabil-Core",
  classical: "Stillhalter",
} as const;

type DeflectionText = {
  de: string;
  en: string;
};

const DEFLECTION_TEXT: Record<GuardCategory, DeflectionText> = {
  crisis: {
    de: "Das, was du beschreibst, geht über das hinaus, was die Matrix halten kann. Bitte wende dich jetzt an die Telefonseelsorge: 0800 111 0 111 — kostenlos, 24 Stunden, anonym. International: findahelpline.com",
    en: "What you're describing goes beyond what the matrix can hold. Please reach out to a crisis line near you — free, 24h, anonymous: findahelpline.com",
  },
  clinical: {
    de: "Das ist außerhalb dessen, was die Matrix abdeckt. Die Matrix ist ein Reflexionsbegleiter — kein Diagnose- oder Behandlungs-Tool. Für klinische Fragen wende dich bitte an eine Fachperson.",
    en: "This is outside what the matrix covers. The matrix is a reflection companion — not a diagnostic or treatment tool. For clinical questions, please consult a professional.",
  },
  out_of_scope: {
    de: "Das liegt außerhalb des Rahmens der Matrix. Ich begleite Reflexion — keine Rechts-, Steuer- oder medizinische Beratung und kein Ghostwriting. Für diese Fragen gibt es bessere Stellen.",
    en: "This falls outside the matrix's scope. I accompany reflection — not legal, tax, or medical advice, and no ghostwriting. There are better places for these questions.",
  },
  moderation: {
    de: "Diese Anfrage kann die Matrix nicht annehmen.",
    en: "The matrix cannot accept this request.",
  },
};

const DEFLECTION_MODE: Record<GuardCategory, string> = {
  crisis: "hard_caution",
  clinical: "soft_deflection",
  out_of_scope: "soft_deflection",
  moderation: "soft_deflection",
};

function buildDeflectionVoice(
  category: GuardCategory,
  locale: ConsultLocale,
): ConsultVoice {
  const text = DEFLECTION_TEXT[category];
  return {
    ...STABIL_CORE_VOICE,
    answer: locale === "en" ? text.en : text.de,
  };
}

export function buildDeflectionResponse(
  category: GuardCategory,
  locale: ConsultLocale,
  requestId: string,
): ConsultResponse {
  const lead = buildDeflectionVoice(category, locale);
  const mode = DEFLECTION_MODE[category];

  return {
    requestId,
    phase: "Stabilisation",
    phaseConfidence: 0,
    lead,
    counterweight: null,
    anchor: null,
    echo: null,
    suppressor: null,
    validation: {
      passed: false,
      mode,
      budgetChars: lead.answer.length,
      actualChars: lead.answer.length,
    },
    evidence: {
      signalHash: "redacted",
      seed: new Date().toISOString(),
      modelVersion: "guard-v1",
    },
  };
}

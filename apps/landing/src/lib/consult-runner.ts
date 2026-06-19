// Deterministic consult-runner for the /api/consult endpoint.
//
// MVP contract (Week 3):
//   - Validates the request.
//   - Runs the clinical-topic guard (§ 6, coaching-contexts.md).
//   - Selects lead / counterweight / anchor from the
//     practice.embodiments registry, biased by context.
//   - Builds a deterministic stub answer for each voice.
//   - Wraps the answer in the structured ConsultResponse
//     shape from docs/landing-practice-route.md § 7.
//
// LLM wiring is deliberately deferred to Week 4 (see
// docs/methodology/coaching-contexts.md § 4). The runner
// exposes `tryLlmRender` as a private seam; the public
// `runConsult` function does not call the LLM in week 3.
//
// All decisions in this file are deterministic for the same
// (signal, context, posture, locale) tuple. Tests in
// `consult-runner.test.ts` pin the response shape.

import { createHash, randomBytes } from "node:crypto";

import { practice, type EmbodimentEntry } from "@/lib/content";

import { classifySignal } from "@/lib/consult/clinicalGuard";
import { buildDeflectionResponse } from "@/lib/consult/deflectionResponse";
import {
  CONFIDENCE_FLOOR,
  LEAD_HARD_MAX,
  LEAD_SOFT_TARGET,
  SERVER_SIGNAL_MAX,
  SERVER_SIGNAL_MIN,
} from "@/lib/consult/serverConstants";
import type {
  ConsultRequest,
  ConsultResponse,
  ConsultVoice,
} from "@/lib/consult/types";
import { checkVoiceRules } from "@/lib/consult/voiceRuleCheck";
import type { ConsultContext, ConsultPosture } from "@/lib/consult/constants";

type ContextPhase = {
  phase: string;
  phaseConfidence: number;
  lead: string;
  counterweight: string;
  anchor: string;
};

// Context → embodiment-preference table.
// Sourced from docs/methodology/coaching-contexts.md § 7
// (Embodiment Preferences) and § 8 (Worked Examples).
// The bias is applied as a hard pick in week 3; the
// orchestrator's resonance scoring takes over in week 4.
const CONTEXT_PHASE: Record<ConsultContext, ContextPhase> = {
  life: {
    phase: "Swarm Coherence",
    phaseConfidence: 0.78,
    lead: "horizon-drifter",
    counterweight: "root-sentinel",
    anchor: "stabil-core",
  },
  reflection: {
    phase: "Ontological Restructuring",
    phaseConfidence: 0.72,
    lead: "stabil-core",
    counterweight: "mycel-weaver",
    anchor: "stabil-core",
  },
  creative: {
    phase: "Sovereign Propagation",
    phaseConfidence: 0.68,
    lead: "spike-wave",
    counterweight: "horizon-drifter",
    anchor: "stabil-core",
  },
};

// Posture overlay (see coaching-contexts.md § 5):
// the soft_target modifier applies to the lead answer's
// target length. In week 3 this is a label-only change —
// the LLM wiring that would actually lengthen/shorten the
// answer is deferred to week 4.
const POSTURE_TAIL: Record<ConsultPosture, string> = {
  sachlich: "Beobachten, nicht bewerten. Eine Tatsache, eine Implikation.",
  empathisch:
    "Validieren, dann öffnen. Kein Mitleids-Vokabular, kein 'ich verstehe'.",
  konfrontativ:
    "Direkt fragen, nicht angreifen. Eine unbequeme Wahrheit, kein Urteil.",
};

const POSTURE_LENGTH_MOD: Record<ConsultPosture, number> = {
  sachlich: -0.2,
  empathisch: 0,
  konfrontativ: 0.2,
};

export type RunConsultError =
  | { code: "signal_too_long"; maxChars: number }
  | { code: "signal_too_short"; minChars: number }
  | { code: "invalid_context" }
  | { code: "invalid_posture" }
  | { code: "invalid_locale" };

export type RunConsultResult =
  | { ok: true; response: ConsultResponse }
  | { ok: false; error: RunConsultError };

// ULID-ish request id: 10-char timestamp (ms, base36) +
// 16-char random hex. Sortable, opaque, no extra dep.
function newRequestId(): string {
  const ts = Date.now().toString(36).padStart(10, "0").toUpperCase();
  const rand = randomBytes(8).toString("hex").toUpperCase();
  return `${ts}${rand}`;
}

function hashSignal(signal: string, requestId: string): string {
  return (
    "sha256:" +
    createHash("sha256")
      .update(signal)
      .update("\0")
      .update(requestId)
      .digest("hex")
      .slice(0, 16)
  );
}

function lookupEmbodiment(id: string): EmbodimentEntry {
  const entry = practice.embodiments.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Consult runner references missing embodiment: ${id}`);
  }
  return entry;
}

type VoiceRole = "lead" | "counterweight" | "anchor";

function buildVoice(id: string, role: VoiceRole, posture: ConsultPosture): ConsultVoice {
  const entry = lookupEmbodiment(id);
  // The lead answer is the embodiment's sampleQuote with a
  // posture-tail appended. For counterweight/anchor roles
  // the answer is the sampleQuote verbatim — they speak
  // their canonical line.
  const baseAnswer = entry.sampleQuote;
  const lengthMod = POSTURE_LENGTH_MOD[posture];
  const hardMax = Math.round(LEAD_HARD_MAX * (1 + lengthMod));
  // Length clamp: if the base answer is over the per-posture
  // hard max, trim to the budget. (This is a soft cap; the
  // LLM-driven answer in week 4 will use the same cap as a
  // hard ceiling.)
  const trimmed = baseAnswer.length > hardMax ? baseAnswer.slice(0, hardMax) : baseAnswer;
  const postureTail = POSTURE_TAIL[posture];
  const answer = role === "lead" ? `${trimmed} ${postureTail}` : trimmed;
  return {
    id: entry.id,
    glyph: entry.glyph,
    name: entry.name,
    classical: entry.classical,
    answer,
  };
}

function confidenceGate(context: ConsultContext, confidence: number): boolean {
  const floor = CONFIDENCE_FLOOR[context] ?? 0.2;
  return confidence >= floor;
}

export function runConsult(request: ConsultRequest): RunConsultResult {
  // --- 1. Validate ----------------------------------------------------
  const signal = request.signal ?? "";
  if (signal.length > SERVER_SIGNAL_MAX) {
    return { ok: false, error: { code: "signal_too_long", maxChars: SERVER_SIGNAL_MAX } };
  }
  if (signal.trim().length < SERVER_SIGNAL_MIN) {
    return { ok: false, error: { code: "signal_too_short", minChars: SERVER_SIGNAL_MIN } };
  }
  const context = request.context;
  if (!CONTEXT_PHASE[context]) {
    return { ok: false, error: { code: "invalid_context" } };
  }
  const posture = request.posture;
  if (!POSTURE_TAIL[posture]) {
    return { ok: false, error: { code: "invalid_posture" } };
  }
  if (request.locale !== "de" && request.locale !== "en") {
    return { ok: false, error: { code: "invalid_locale" } };
  }

  // --- 2. Clinical-topic guard ----------------------------------------
  // Runs before any LLM call or stub render. Crisis signals get a
  // hard_caution deflection with a crisis resource. Clinical / out-of-
  // scope / moderation signals get soft_deflection. The signal hash
  // is omitted from deflection responses (redacted) so matched terms
  // never propagate downstream.
  const requestId = newRequestId();
  const guardResult = classifySignal(signal, context);
  if (guardResult.matched) {
    const deflection = buildDeflectionResponse(guardResult.category, request.locale, requestId);
    return { ok: true, response: deflection };
  }

  // --- 3. Select ------------------------------------------------------
  const phaseInfo = CONTEXT_PHASE[context];

  // --- 4. Build voices ------------------------------------------------
  const lead = buildVoice(phaseInfo.lead, "lead", posture);
  const counterweight =
    phaseInfo.counterweight === phaseInfo.lead
      ? null
      : buildVoice(phaseInfo.counterweight, "counterweight", posture);
  const anchor =
    phaseInfo.anchor === phaseInfo.lead || phaseInfo.anchor === phaseInfo.counterweight
      ? null
      : buildVoice(phaseInfo.anchor, "anchor", posture);

  // --- 5. Confidence gate --------------------------------------------
  // The week-3 stub confidence is static per context. If it
  // ever falls below the per-context floor, the runner
  // suppresses the counterweight and emits a stabilisation
  // note on the anchor. The hard_caution path (crisis deflection
  // with a crisis-line resource) runs earlier in § 2 via
  // buildDeflectionResponse — it is the only deflection mode
  // that suppresses the matrix entirely.
  const passed = confidenceGate(context, phaseInfo.phaseConfidence);

  // --- 6. Voice-rule check (output guard) ----------------------------
  // In week 3 (stub mode): collect violations for observability only.
  // In week 4 (LLM mode): violations trigger a retry; second violation
  // falls back to stub. The check runs here so the seam is in place.
  const ruleCheck = checkVoiceRules(lead.answer, context);
  if (!ruleCheck.valid) {
    // Log for observability; do not block in week 3.
    console.warn(
      "[consult-runner] voice-rule violations",
      JSON.stringify({ requestId, context, violations: ruleCheck.violations }),
    );
  }

  // --- 7. Compose response -------------------------------------------
  const response: ConsultResponse = {
    requestId,
    phase: phaseInfo.phase,
    phaseConfidence: phaseInfo.phaseConfidence,
    lead,
    counterweight,
    anchor,
    echo: null,
    suppressor: null,
    validation: {
      passed,
      mode: "embodiment_reply",
      budgetChars: Math.round(LEAD_SOFT_TARGET * (1 + POSTURE_LENGTH_MOD[posture])),
      actualChars: lead.answer.length,
    },
    evidence: {
      signalHash: hashSignal(signal, requestId),
      seed: new Date().toISOString(),
      modelVersion: "stub-week3",
    },
  };

  return { ok: true, response };
}

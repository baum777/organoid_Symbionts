// Deterministic + LLM consult-runner for the /api/consult endpoint.
//
// Pipeline (in order):
//   1. Validate the request (signal length, context, posture, locale).
//   2. Run the clinical-topic guard. Crisis/clinical/out_of_scope/
//      moderation signals get a deflection and never reach the LLM.
//   3. Select phase info: phase name, phaseConfidence, lead /
//      counterweight / anchor embodiment ids (per CONTEXT_PHASE).
//   4. Try the LLM seam for the lead answer. If no LLM is configured
//      (LLM_PROVIDER unset) or the call fails, fall back to the
//      deterministic stub.
//   5. Run the voice-rule check on the lead answer.
//      - Stub answer: warn-only (no retry), stub answers may trip
//        a rule by design (sampleQuote is canonical).
//      - LLM answer: first violation → retry once; second violation
//        → fall back to stub.
//   6. Compose the structured ConsultResponse.
//
// All decisions in this file are deterministic for the same
// (signal, context, posture, locale) tuple modulo the LLM path,
// which is non-deterministic by design. Tests in
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

import { buildLeadPrompt } from "@/lib/llm/prompt";
import { getLlmClient, __resetLlmClientForTests } from "@/lib/llm/client";
import type { LlmClient } from "@/lib/llm/types";

type ContextPhase = {
  phase: string;
  phaseConfidence: number;
  lead: string;
  counterweight: string;
  anchor: string;
};

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

const STUB_MODEL_VERSION = "stub-week3";
const LLM_TEMPERATURE = 0.7;
const MAX_LLM_RETRIES = 1;

export type RunConsultError =
  | { code: "signal_too_long"; maxChars: number }
  | { code: "signal_too_short"; minChars: number }
  | { code: "invalid_context" }
  | { code: "invalid_posture" }
  | { code: "invalid_locale" };

export type RunConsultResult =
  | { ok: true; response: ConsultResponse }
  | { ok: false; error: RunConsultError };

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

function buildVoice(
  id: string,
  role: VoiceRole,
  posture: ConsultPosture,
  override?: string,
): ConsultVoice {
  const entry = lookupEmbodiment(id);
  const baseAnswer = override ?? entry.sampleQuote;
  const lengthMod = POSTURE_LENGTH_MOD[posture];
  const hardMax = Math.round(LEAD_HARD_MAX * (1 + lengthMod));
  const trimmed = baseAnswer.length > hardMax ? baseAnswer.slice(0, hardMax) : baseAnswer;
  const postureTail = POSTURE_TAIL[posture];
  // The posture-tail is appended to the lead voice in the stub path
  // (the canonical sampleQuote doesn't carry the coachy framing). In
  // the LLM path the model already writes the answer in the requested
  // posture, so the tail is suppressed to avoid double-framing.
  const answer = role === "lead" && !override ? `${trimmed} ${postureTail}` : trimmed;
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

function softBudget(posture: ConsultPosture): number {
  return Math.round(LEAD_SOFT_TARGET * (1 + POSTURE_LENGTH_MOD[posture]));
}

type LlmOutcome = { answer: string; modelVersion: string } | null;

function parseLlmAnswer(text: string): string | null {
  // The model is asked to return strict JSON { "answer": "..." }.
  // Be lenient: strip code-fence wrappers, then JSON.parse, then
  // fall back to a regex extraction if the parse fails.
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    const obj = JSON.parse(stripped) as unknown;
    if (obj && typeof obj === "object" && "answer" in obj) {
      const a = (obj as { answer: unknown }).answer;
      if (typeof a === "string" && a.length > 0) return a;
    }
  } catch {
    // fall through
  }
  const m = text.match(/"answer"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (m && typeof m[1] === "string") {
    try {
      return JSON.parse(`"${m[1]}"`) as string;
    } catch {
      return m[1];
    }
  }
  return null;
}

async function tryLlmRender(
  client: LlmClient,
  embodiment: EmbodimentEntry,
  signal: string,
  context: ConsultContext,
  posture: ConsultPosture,
  locale: "de" | "en",
  budget: number,
): Promise<LlmOutcome> {
  const prompt = buildLeadPrompt({ embodiment, signal, context, posture, locale, budget });
  try {
    const result = await client.complete({
      system: prompt.system,
      user: prompt.user,
      maxTokens: budget,
      temperature: LLM_TEMPERATURE,
    });
    const answer = parseLlmAnswer(result.text);
    if (!answer) return null;
    return { answer, modelVersion: result.modelVersion };
  } catch {
    return null;
  }
}

export async function runConsult(request: ConsultRequest): Promise<RunConsultResult> {
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
  const requestId = newRequestId();
  const guardResult = classifySignal(signal, context);
  if (guardResult.matched) {
    const deflection = buildDeflectionResponse(guardResult.category, request.locale, requestId);
    return { ok: true, response: deflection };
  }

  // --- 3. Select phase info -------------------------------------------
  const phaseInfo = CONTEXT_PHASE[context];
  const leadEntry = lookupEmbodiment(phaseInfo.lead);
  const budget = softBudget(posture);

  // --- 4. LLM seam with voice-rule retry ------------------------------
  // Try the LLM at most MAX_LLM_RETRIES+1 times. On first voice-rule
  // violation, retry with a fresh call. On second violation (or any
  // LLM error), fall back to the deterministic stub. The counterweight
  // and anchor never go through the LLM — they keep the canonical
  // sampleQuote, which is the safe-and-boring choice.
  const client = getLlmClient();
  let llmOutcome: LlmOutcome = null;
  if (client) {
    for (let attempt = 0; attempt <= MAX_LLM_RETRIES; attempt++) {
      const outcome = await tryLlmRender(
        client,
        leadEntry,
        signal,
        context,
        posture,
        request.locale,
        budget,
      );
      if (!outcome) {
        // LLM error or unparseable response — fall back to stub.
        break;
      }
      const ruleCheck = checkVoiceRules(outcome.answer, context);
      if (ruleCheck.valid) {
        llmOutcome = outcome;
        break;
      }
      if (attempt < MAX_LLM_RETRIES) {
        // First violation → retry. Log for observability.
        console.warn(
          "[consult-runner] voice-rule violation — retrying LLM",
          JSON.stringify({ requestId, context, attempt, violations: ruleCheck.violations }),
        );
        continue;
      }
      // Second violation → fall back to stub.
      console.warn(
        "[consult-runner] voice-rule violation after retry — falling back to stub",
        JSON.stringify({ requestId, context, violations: ruleCheck.violations }),
      );
      break;
    }
  }

  // --- 5. Build voices ------------------------------------------------
  const lead = buildVoice(phaseInfo.lead, "lead", posture, llmOutcome?.answer);
  const counterweight =
    phaseInfo.counterweight === phaseInfo.lead
      ? null
      : buildVoice(phaseInfo.counterweight, "counterweight", posture);
  const anchor =
    phaseInfo.anchor === phaseInfo.lead || phaseInfo.anchor === phaseInfo.counterweight
      ? null
      : buildVoice(phaseInfo.anchor, "anchor", posture);

  // --- 6. Confidence gate --------------------------------------------
  const passed = confidenceGate(context, phaseInfo.phaseConfidence);

  // --- 7. Voice-rule check on stub path -------------------------------
  // In the LLM path, the check above already enforced the rules. This
  // block only fires for the stub path, where the canonical sampleQuote
  // may trip a rule by design. Warn-only — never block.
  if (!llmOutcome) {
    const ruleCheck = checkVoiceRules(lead.answer, context);
    if (!ruleCheck.valid) {
      console.warn(
        "[consult-runner] voice-rule violations (stub path)",
        JSON.stringify({ requestId, context, violations: ruleCheck.violations }),
      );
    }
  }

  // --- 8. Compose response -------------------------------------------
  const modelVersion = llmOutcome?.modelVersion ?? STUB_MODEL_VERSION;
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
      budgetChars: budget,
      actualChars: lead.answer.length,
    },
    evidence: {
      signalHash: hashSignal(signal, requestId),
      seed: new Date().toISOString(),
      modelVersion,
    },
  };

  return { ok: true, response };
}

// Re-export the test injection helper so consult-runner.test.ts can
// mock the LLM client without importing from the llm module path
// twice. (vitest's vi.mock requires a single canonical path.)
export { __resetLlmClientForTests };

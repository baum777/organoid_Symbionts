/**
 * Full Spectrum Prompt Builder — Master & Refine prompts for StructuredRoast flow
 */

import type { CanonicalEvent, ScoreBundle, ThesisBundle, StructuredRoast } from "./types.js";
import type { RelevanceResult } from "./relevanceScorer.js";
import type { StyleContext } from "../style/styleResolver.js";
import type { OrganoidOrchestrationPlan } from "../organoid/orchestration.js";
import { formatOrganoidPromptBlock } from "../organoid/orchestration.js";
import {
  getSlangGuidelines,
  getSavageSlangGuidelines,
  getUltraSavageGuidelines,
  getDegenRegardGuidelines,
} from "../style/styleResolver.js";
import {
  MASTER_SYSTEM_PROMPT,
  REFINE_PROMPT_TEMPLATE,
  NEGATIVE_EXAMPLES,
} from "./prompts/fullSpectrumPrompts.js";

export interface FullSpectrumLLMInput {
  system: string;
  developer: string;
  user: string;
}

/** Heuristik: Standalone-Mention ohne Thread-Kontext */
function isStandaloneMention(event: CanonicalEvent): boolean {
  return (
    !event.parent_text &&
    (event.conversation_context?.length ?? 0) === 0
  );
}

export function buildMasterPrompt(
  event: CanonicalEvent,
  thesis: ThesisBundle,
  scores: ScoreBundle,
  relevanceResult?: RelevanceResult,
  /** Organoid-memory snippets, nur bei Standalone-Mentions */
  organoidSnippets?: string[],
  /** Style context for savage/ultra/degen horny-slang blocks */
  style?: StyleContext,
  /** Pre-LLM estimated bissigkeit for prompt hint */
  estimatedBissigkeit?: number,
  /** Additive organoid orchestration context */
  organoid?: OrganoidOrchestrationPlan,
  orchestrationEligibility?: "standard" | "orchestration_eligible_minimal",
  orchestrationReason?: string,
): FullSpectrumLLMInput {
  const thesisStr =
    (event as { thesis?: string }).thesis ?? String(thesis.primary);
  const bissHint =
    estimatedBissigkeit != null
      ? `\n\nInitial estimated bissigkeit (pre-LLM, heuristic only): ~${estimatedBissigkeit.toFixed(1)}\nNutze diesen Wert als grobe Richtung, kalibriere im JSON-Output selbst.`
      : "";
  const user = [
    "Aktuelle Mention:",
    event.text,
    "",
    "Thread-Kontext:",
    event.parent_text || event.context || "kein Kontext",
    "",
    `These: ${thesisStr}`,
    thesis.evidence_bullets.length > 0
      ? `Evidence:\n${thesis.evidence_bullets.map((b) => `- ${b}`).join("\n")}`
      : "",
    bissHint,
  ]
    .filter(Boolean)
    .join("\n");

  const memoryBlock =
    isStandaloneMention(event) &&
    organoidSnippets &&
    organoidSnippets.length > 0
      ? `Organoid memory from recent runs:\n${organoidSnippets.map((s) => `• ${s}`).join("\n")}\n\n`
      : "";

  let system = `${MASTER_SYSTEM_PROMPT}\n\n${memoryBlock}${NEGATIVE_EXAMPLES}`;

  if (organoid) {
    system += `\n\n${formatOrganoidPromptBlock(organoid).join("\n")}`;
  }
  if (orchestrationEligibility) {
    system += `\n\nOrchestration intake: ${orchestrationEligibility}`;
  }
  if (orchestrationReason) {
    system += `\nOrchestration intake reason: ${orchestrationReason}`;
  }

  if (style?.slangEnabled) {
    system += `\n\n=== HORNY-SLANG ENERGY MODE ACTIVE ===\n${getSlangGuidelines()}`;
  }
  if (style?.savage_horny_slang) {
    system += `\n\n${getSavageSlangGuidelines()}`;
  }
  if (style?.ultra_savage) {
    system += `\n\n${getUltraSavageGuidelines()}`;
  }
  if (style?.degen_regard) {
    system += `\n\n${getDegenRegardGuidelines()}`;
  }

  return {
    system,
    developer: "Antworte ausschließlich im JSON-Format wie spezifiziert. Kein Text davor oder danach.",
    user,
  };
}

export function buildRefinePromptFullSpectrum(
  event: CanonicalEvent,
  previous: StructuredRoast,
  thesis: ThesisBundle,
  scores: ScoreBundle,
  relevanceResult?: RelevanceResult,
): FullSpectrumLLMInput {
  const score = relevanceResult?.score ?? (event as { relevance_score?: number }).relevance_score ?? scores.relevance;
  const intensity =
    relevanceResult?.components?.sentiment_intensity ??
    (event as { sentiment_intensity?: number }).sentiment_intensity ??
    0.3;
  const threadContext = event.parent_text || event.context || "kein Kontext";
  const thesisStr =
    (event as { thesis?: string }).thesis ?? String(thesis.primary);

  const user = REFINE_PROMPT_TEMPLATE.replace(/{previous_roast_text}/g, previous.roast_text)
    .replace(/{critique_summary}/g, previous.critique_summary ?? "zu flach / zu kurz")
    .replace(/{full_mention_text}/g, event.text)
    .replace(/{thread_context}/g, threadContext)
    .replace(/{thesis}/g, thesisStr)
    .replace(/{score}/g, typeof score === "number" ? score.toFixed(2) : String(score))
    .replace(/{intensity}/g, typeof intensity === "number" ? intensity.toFixed(2) : String(intensity));

  return {
    system:
      "Du bist das Organoid-Array. Refine deine schwache Antwort. Antworte ausschließlich im JSON-Format.",
    developer:
      "Return JSON: roast_text, used_memes, bissigkeit_score, missed_keywords, needs_refine, critique_summary.",
    user,
  };
}

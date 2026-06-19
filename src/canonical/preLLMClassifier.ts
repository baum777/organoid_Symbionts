/**
 * Pre-LLM tier classifier (Phase 1).
 *
 * Two paths:
 *   1) LLM path — calls an LLMClient (LFM2.5 local, OpenRouter LFM25, or
 *      OpenRouter Llama-1B) with a strict JSON-only system prompt.
 *   2) Rule-based fallback — synchronous, ~70% intent accuracy, used when
 *      PIPELINE_PRE_LLM_PROVIDER=rule-based or every LLM provider failed.
 *
 * Hard guards (enforceHardGuards) defensively add internal-token violations
 * if the LLM missed them. This ensures the public-safety invariant holds
 * even on partial LLM responses.
 */

import type { LLMClient, LLMRequest } from "../clients/llmClient.js";
import type { IntentClass, TargetClass } from "./types.js";

export type PreLLMLanguage = "de" | "en" | "mixed" | "other";
export type PreLLMSentiment = "bullish" | "bearish" | "neutral";

export type PreLLMProviderId =
  | "xai"
  | "lfm25-local"
  | "openrouter-lfm25"
  | "openrouter-llama-1b"
  | "rule-based";

export interface PreLLMResult {
  intent: IntentClass;
  confidence: number;
  target_class: TargetClass;
  language: PreLLMLanguage;
  crisis_flag: boolean;
  violation_flags: string[];
  tokens: string[];
  contract_addresses: string[];
  sentiment_per_token: Record<string, PreLLMSentiment>;
  contains_internal_token: boolean;
  internal_violations: string[];
  provider: PreLLMProviderId;
}

const FORBIDDEN_INTERNAL_TOKENS = [
  "score",
  "xp",
  "threshold",
  "cooldown",
  "trace",
  "risk",
  "telemetry",
  "flag",
  "level",
  "rarity",
  "combo",
  "mythic",
  "epic",
  "internal",
  "meta",
  "seed",
  "rng",
  "hash",
];

const SYSTEM_PROMPT = `You are a JSON-only pre-classifier for an X-engagement coaching system.
Output only valid JSON. Never prose. Never markdown. Never code fences.
Schema:
{
  "intent": "<one of: greeting|casual_ping|question|market_question_general|embodiment_query|lore_query|conversation_continue|conceptual_probe|structured_critique|hype_claim|performance_claim|launch_announcement|market_narrative|accusation|bait|spam|meme_only|irrelevant|ca_request|own_token_sentiment>",
  "confidence": <0-1>,
  "target_class": "<one of: token|project|chart_action|claim|behavior|narrative|market_structure|embodiment|lore|conversation|none>",
  "language": "<de|en|mixed|other>",
  "crisis_flag": <bool>,
  "violation_flags": [<array of: "guarantee_claim"|"buy_sell_language"|"as_ai_meta"|"urgency_theater">],
  "tokens": [<array of $TICKER strings without the $ sign>],
  "contract_addresses": [<array of Solana base58 strings>],
  "sentiment_per_token": { "<token>": "<bullish|bearish|neutral>" },
  "contains_internal_token": <bool>,
  "internal_violations": [<array of: score|xp|rarity|mythic|...>]
}`;

function emptyResult(provider: PreLLMProviderId): PreLLMResult {
  return {
    intent: "irrelevant",
    confidence: 0,
    target_class: "none",
    language: "en",
    crisis_flag: false,
    violation_flags: [],
    tokens: [],
    contract_addresses: [],
    sentiment_per_token: {},
    contains_internal_token: false,
    internal_violations: [],
    provider,
  };
}

export { emptyResult };

function applyHardGuards(result: PreLLMResult, input: string): PreLLMResult {
  const lower = input.toLowerCase();
  for (const tok of FORBIDDEN_INTERNAL_TOKENS) {
    const re = new RegExp(`\\b${tok}\\b`, "i");
    if (re.test(lower) && !result.internal_violations.includes(tok)) {
      result.internal_violations.push(tok);
      result.contains_internal_token = true;
    }
  }
  if (result.internal_violations.length > 0) {
    result.contains_internal_token = true;
  }
  return result;
}

/**
 * LLM path: ask the configured LLM for a structured PreLLMResult, then
 * defensively re-apply internal-token hard guards.
 */
export async function classifyWithPreLLM(
  input: string,
  client: LLMClient,
  provider: PreLLMProviderId = "lfm25-local",
): Promise<PreLLMResult> {
  const req: LLMRequest = {
    system: SYSTEM_PROMPT,
    developer: "Return only valid JSON matching the schema. No commentary. No markdown.",
    user: input,
    temperature: 0.1,
    max_tokens: 256,
  };

  const raw = await client.generateJSON<Partial<PreLLMResult>>(req);
  const merged: PreLLMResult = { ...emptyResult(provider), ...raw, provider };
  return applyHardGuards(merged, input);
}

const CRISIS_RE = /(ich\s+halt.*nicht.*aus|selbstmord|ending\s+it|suizid|suicide)/i;
const BUY_RE = /\b(buy|long|short|sell)\b/i;
const QUESTION_RE = /\?$/;
const DE_RE = /[äöüß]/;
const CASHTAG_RE = /\$([A-Z]{2,10})/g;
const CONTRACT_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

/**
 * Rule-based fallback. ~70% intent-classification accuracy, but always
 * available even when all LLM providers are down.
 */
export function classifyWithRules(input: string): PreLLMResult {
  const hasCrisis = CRISIS_RE.test(input);
  const hasBuy = BUY_RE.test(input);
  const hasQuestion = QUESTION_RE.test(input.trim());
  const cashtags = Array.from(input.matchAll(CASHTAG_RE))
    .map((m) => m[1])
    .filter((s): s is string => Boolean(s));
  const contractMatch = input.match(CONTRACT_RE) ?? [];

  const intent: IntentClass = hasCrisis
    ? "casual_ping"
    : hasBuy
      ? "own_token_sentiment"
      : hasQuestion
        ? "question"
        : "casual_ping";

  return applyHardGuards(
    {
      ...emptyResult("rule-based"),
      intent,
      confidence: 0.5,
      target_class: cashtags.length > 0 ? "token" : "none",
      language: DE_RE.test(input) ? "de" : "en",
      crisis_flag: hasCrisis,
      violation_flags: hasBuy ? ["buy_sell_language"] : [],
      tokens: cashtags,
      contract_addresses: contractMatch,
    },
    input,
  );
}

/**
 * Resolve the primary Pre-LLM provider from env. Defaults to lfm25-local.
 * Note: xAI is intentionally demoted to rule-based for pre-classification
 * (too expensive for the per-mention call rate).
 */
export function selectPreLLMProvider(): PreLLMProviderId {
  const v = (process.env.PIPELINE_PRE_LLM_PROVIDER || "lfm25-local").toLowerCase();
  if (v === "xai") return "rule-based";
  if (
    v === "lfm25-local" ||
    v === "openrouter-lfm25" ||
    v === "openrouter-llama-1b" ||
    v === "rule-based"
  ) {
    return v;
  }
  return "lfm25-local";
}

export function selectPreLLMFallback(): PreLLMProviderId {
  const v = (process.env.PIPELINE_PRE_LLM_FALLBACK || "openrouter-llama-1b").toLowerCase();
  if (
    v === "lfm25-local" ||
    v === "openrouter-lfm25" ||
    v === "openrouter-llama-1b" ||
    v === "rule-based"
  ) {
    return v;
  }
  return "openrouter-llama-1b";
}

export { FORBIDDEN_INTERNAL_TOKENS, SYSTEM_PROMPT, applyHardGuards };

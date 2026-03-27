import type { CanonicalEvent } from "./types.js";

export interface ConversationContinueAssessment {
  hasParentContext: boolean;
  formSignal: boolean;
  relevanceSignal: boolean;
  continuationSignal: boolean;
  continuationSupportScore: number;
  reasons: string[];
}

const CONTINUATION_FORM_PATTERNS: RegExp[] = [
  /^(?:and|so|then)\b/i,
  /\band\s+what\s+about\b/i,
  /\bthen\s+where\s+is\b/i,
  /\bwhat\s+fails?\s+first\b/i,
  /\bwhat\s+bottlenecks?\b/i,
  /\bwhere\s+is\s+the\s+bottleneck\b/i,
  /\bwhere\s+does\b.*\b(?:break|fail|bottleneck|break\s+down)\b/i,
];

const CONTINUATION_RELEVANCE_PATTERNS: RegExp[] = [
  /\bexecution\b/i,
  /\bbottleneck(?:s)?\b/i,
  /\barchitecture\b/i,
  /\bstructure\b/i,
  /\bthesis\b/i,
  /\bincentive(?:s)?\b/i,
  /\brisk\b/i,
  /\binterface\b/i,
  /\bfailure(?:\s+mode)?\b/i,
  /\bbreak(?:s|down)?\b/i,
  /\bconstraint(?:s)?\b/i,
  /\btrade[- ]?off(?:s)?\b/i,
  /\bdependenc(?:y|ies)\b/i,
  /\bimplementation\b/i,
];

const CONTINUATION_NEGATIVE_PATTERNS: RegExp[] = [
  /^\s*(?:and|so|then)\s*[?!.]*$/i,
  /^\s*(?:and|so|then)\s+(?:lol|lmao|lmfao|haha|hehe|bruh|bro)\b/i,
  /^\s*(?:and|so|then)\s+(?:buy|sell|ape|long|short|trade)\b/i,
  /^\s*(?:what\s+now|now\s+what|why\??|so\??|and\??)\s*$/i,
];

function normalize(text: string): string {
  return (text ?? "").trim().replace(/\s+/g, " ");
}

function wordCount(text: string): number {
  const normalized = normalize(text);
  if (!normalized) return 0;
  return normalized.split(" ").filter(Boolean).length;
}

function hasPatternMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function hasRelevantParentContext(event: CanonicalEvent): boolean {
  return Boolean(
    event.parent_text?.trim() ||
    event.quoted_text?.trim() ||
    event.context?.trim() ||
    (event.conversation_context?.length ?? 0) > 0,
  );
}

export function looksLikeContinuation(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  return hasPatternMatch(normalized, CONTINUATION_FORM_PATTERNS);
}

export function hasContinuationRelevance(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  return hasPatternMatch(normalized, CONTINUATION_RELEVANCE_PATTERNS);
}

function isNegativeContinuation(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return true;
  if (wordCount(normalized) < 3) return true;
  return hasPatternMatch(normalized, CONTINUATION_NEGATIVE_PATTERNS);
}

export function assessConversationContinue(
  text: string,
  event: CanonicalEvent,
): ConversationContinueAssessment {
  const normalized = normalize(text);
  const hasParentContext = hasRelevantParentContext(event);
  const formSignal = looksLikeContinuation(normalized);
  const relevanceSignal = hasContinuationRelevance(normalized);
  const negativeSignal = isNegativeContinuation(normalized);
  const supportScore = Math.round(
    (
      (
        (formSignal ? 1 : 0) +
        (hasParentContext ? 1 : 0) +
        (relevanceSignal ? 1 : 0)
      ) / 3
    ) * 100,
  ) / 100;

  const reasons: string[] = [];
  if (formSignal) reasons.push("form_signal");
  if (hasParentContext) reasons.push("parent_context");
  if (relevanceSignal) reasons.push("relevance_signal");
  if (negativeSignal) reasons.push("negative_followup");

  return {
    hasParentContext,
    formSignal,
    relevanceSignal,
    continuationSignal: formSignal && hasParentContext && relevanceSignal && !negativeSignal,
    continuationSupportScore: supportScore,
    reasons,
  };
}

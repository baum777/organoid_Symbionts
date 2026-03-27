import type { CanonicalEvent } from "./types.js";
import { hasRelevantParentContext } from "./conversationContinue.js";

export interface StructuredCritiqueAssessment {
  hasParentContext: boolean;
  formSignal: boolean;
  relevanceSignal: boolean;
  structuredCritiqueSignal: boolean;
  structuredCritiqueSupportScore: number;
  reasons: string[];
}

const STRUCTURED_CRITIQUE_FORM_PATTERNS: RegExp[] = [
  /\b(?:don't\s+trust|do\s+not\s+trust|not\s+convinced|not\s+buying|not\s+sold)\b/i,
  /\b(?:looks?|seems?|appears?)\s+(?:clean|fine|solid|tidy)\b.*\b(?:but|however|yet)\b/i,
  /\b(?:structure|architecture|setup|system)\s+(?:is|looks|seems)\s+(?:fine|clean|solid)\b.*\b(?:but|however|yet)\b/i,
  /\b(?:the\s+problem\s+is|the\s+issue\s+is)\b/i,
  /\b(?:incentives?|alignment|trust)\s+(?:are|is|feel|looks?)\s*(?:not|off|broken|wrong)\b/i,
  /\b(?:works?\s+on\s+paper|looks?\s+good\s+on\s+paper)\b/i,
  /\b(?:fragile|brittle|misaligned|sketchy|paper\s+thin|thin)\b/i,
];

const STRUCTURED_CRITIQUE_RELEVANCE_PATTERNS: RegExp[] = [
  /\bexecution\b/i,
  /\bbottleneck(?:s)?\b/i,
  /\barchitecture\b/i,
  /\bstructure\b/i,
  /\bthesis\b/i,
  /\bincentive(?:s)?\b/i,
  /\balignment\b/i,
  /\btrust\b/i,
  /\brisk\b/i,
  /\binterface\b/i,
  /\bfailure(?:\s+mode)?\b/i,
  /\bbreak(?:s|down)?\b/i,
  /\bconstraint(?:s)?\b/i,
  /\btrade[- ]?off(?:s)?\b/i,
  /\bdependenc(?:y|ies)\b/i,
  /\bimplementation\b/i,
  /\bmechanism(?:s)?\b/i,
  /\bcoordination\b/i,
];

const STRUCTURED_CRITIQUE_NEGATIVE_PATTERNS: RegExp[] = [
  /^\s*(?:and|so|then)\s*[?!.]*$/i,
  /^\s*(?:and|so|then)\s+(?:lol|lmao|lmfao|haha|hehe|bruh|bro)\b/i,
  /^\s*(?:and|so|then)\s+(?:buy|sell|ape|long|short|trade)\b/i,
  /^\s*(?:what\s+now|now\s+what|why\??|so\??|and\??)\s*$/i,
  /^\s*(?:nice\s+weather|gm|good\s+morning|good\s+evening)\s*$/i,
];

const WETWARE_CRITIQUE_FORM_PATTERNS: RegExp[] = [
  /^\s*this\s+sounds?\s+efficient\b.*\binterface\b.*\boverhead\b.*\bdominates\b/i,
  /^\s*the\s+substrate\s+may\s+learn\b.*\bcontrol\s+layer\b.*\breal\s+work\b/i,
  /^\s*code[- ]?deployable\b.*\bsoftware\s+metaphor\b/i,
  /^\s*people\s+are\s+confusing\s+adaptive\s+tissue\b.*\bgeneral\s+intelligence\b/i,
  /^\s*the\s+hype\s+outruns\s+the\s+interface\b/i,
  /^\s*this\s+looks?\s+promising\b.*\breproducibility\b.*\breal\s+bottleneck\b/i,
  /^\s*they\s+call\s+it\s+replacement\b.*\bhybrid\s+stack\b/i,
  /^\s*sentience\s+language\b.*\bout(?:runs|racing|running)\b.*\bdata\b/i,
];

const WETWARE_CRITIQUE_RELEVANCE_PATTERNS: RegExp[] = [
  /\binterface\b/i,
  /\boverhead\b/i,
  /\bcontrol\s+layer\b/i,
  /\bsubstrate\b/i,
  /\badaptive\s+tissue\b/i,
  /\bgeneral\s+intelligence\b/i,
  /\breproducibility\b/i,
  /\bhybrid\s+stack\b/i,
  /\bcode[- ]?deployable\b/i,
  /\bsoftware\s+metaphor\b/i,
  /\bsentience\b/i,
  /\bdata\b/i,
  /\bhype\b/i,
  /\bbiological\s+comput(?:ing|ation)\b/i,
  /\borganoid(?:s)?\b/i,
  /\bbiohybrid\b/i,
  /\bwetware\b/i,
  /\bplasticity\b/i,
  /\bdecod(?:e|ing|er|ers)\b/i,
  /\binterface\s+bottleneck\b/i,
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

function isNegativeStructuredCritique(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return true;
  if (wordCount(normalized) < 4) return true;
  return hasPatternMatch(normalized, STRUCTURED_CRITIQUE_NEGATIVE_PATTERNS);
}

export function looksLikeStructuredCritique(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  return (
    hasPatternMatch(normalized, STRUCTURED_CRITIQUE_FORM_PATTERNS) ||
    hasPatternMatch(normalized, WETWARE_CRITIQUE_FORM_PATTERNS)
  );
}

export function hasStructuredCritiqueRelevance(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;
  return (
    hasPatternMatch(normalized, STRUCTURED_CRITIQUE_RELEVANCE_PATTERNS) ||
    hasPatternMatch(normalized, WETWARE_CRITIQUE_RELEVANCE_PATTERNS)
  );
}

export function assessStructuredCritique(
  text: string,
  event: CanonicalEvent,
): StructuredCritiqueAssessment {
  const normalized = normalize(text);
  const hasParentContext = hasRelevantParentContext(event);
  const formSignal = looksLikeStructuredCritique(normalized);
  const relevanceSignal = hasStructuredCritiqueRelevance(normalized);
  const negativeSignal = isNegativeStructuredCritique(normalized);

  const supportScore = Math.round(
    ((((formSignal ? 1 : 0) + (relevanceSignal ? 1 : 0) + (hasParentContext ? 1 : 0)) / 3) * 100),
  ) / 100;

  const reasons: string[] = [];
  if (formSignal) reasons.push("form_signal");
  if (relevanceSignal) reasons.push("relevance_signal");
  if (hasParentContext) reasons.push("parent_context");
  if (negativeSignal) reasons.push("negative_followup");

  return {
    hasParentContext,
    formSignal,
    relevanceSignal,
    structuredCritiqueSignal: formSignal && relevanceSignal && !negativeSignal,
    structuredCritiqueSupportScore: supportScore,
    reasons,
  };
}

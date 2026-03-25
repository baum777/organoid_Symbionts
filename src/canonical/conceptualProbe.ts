import type { CanonicalEvent, ClassifierOutput, ScoreBundle } from "./types.js";

type FrontierDomainTag = "ai" | "wetware" | "transhuman" | "crypto" | "structural";

const STRUCTURED_FORM_PATTERNS: RegExp[] = [
  /^\s*what(?:'s|\s+is|\s+are)\b/i,
  /^\s*what limits\b/i,
  /^\s*how do\b/i,
  /^\s*why does\b/i,
  /^\s*do you think\b/i,
  /^\s*should humans\b/i,
  /^\s*is\s+.+\s+viable\b/i,
  /^\s*will\s+.+\?\s*$/i,
];

const FRONTIER_DOMAIN_PATTERNS: Array<[FrontierDomainTag, RegExp[]]> = [
  [
    "ai",
    [
      /\bai\b/i,
      /\bagi\b/i,
      /\bllms?\b/i,
      /\bmodel(?:s)?\b/i,
      /\binference\b/i,
      /\b(?:current\s+)?llm(?:s)?\b/i,
      /\barchitectur(?:e|es)\b/i,
    ],
  ],
  [
    "wetware",
    [
      /\bwetware\b/i,
      /\borganoid(?:s)?\b/i,
      /\bbiocomput(?:er|ing|ation)?\b/i,
      /\bbiological\s+comput(?:ing|ation)\b/i,
    ],
  ],
  [
    "transhuman",
    [
      /\btranshuman(?:ism)?\b/i,
      /\bposthuman(?:ism)?\b/i,
      /\bdigital\s+migration\b/i,
      /\bmerge\s+with\s+machines\b/i,
      /\bbiological\s+bodies?\s+are\s+obsolete\b/i,
    ],
  ],
  [
    "crypto",
    [
      /\bcrypto\b/i,
      /\bsolana\b/i,
      /\btoken\b/i,
      /\bmarket\b/i,
    ],
  ],
  [
    "structural",
    [
      /\bconvergen(?:ce|t)\b/i,
      /\bstructural\b/i,
      /\bviable\b/i,
      /\barchitecture\b/i,
      /\blimit(?:s|ed)?\b/i,
      /\blong\s+term\b/i,
    ],
  ],
];

const MARKET_CLUSTER_PATTERNS: RegExp[] = [
  /\bprice(?:s)?\b/i,
  /\bchart(?:s|ing)?\b/i,
  /\btrade(?:s|d|ing)?\b/i,
  /\bliquidity\b/i,
  /\bliq\b/i,
  /\bvolume\b/i,
  /\border\s*book\b/i,
  /\bmarket\s*cap\b/i,
  /\bmcap\b/i,
  /\btvl\b/i,
  /\bslippage\b/i,
  /\bentry\b/i,
  /\bexit\b/i,
  /\bsupport\b/i,
  /\bresistance\b/i,
  /\bperps?\b/i,
  /\bspot\b/i,
  /\bprice\s+action\b/i,
];

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

function stripInvocationPrefix(text: string): string {
  return text
    .replace(/^(?:@\w+\s*)+/i, "")
    .replace(/^\s*explicit\s+opt[- ]?in[:\-\s]*/i, "")
    .trim();
}

function detectFrontierTags(text: string): Set<FrontierDomainTag> {
  const tags = new Set<FrontierDomainTag>();
  for (const [tag, patterns] of FRONTIER_DOMAIN_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) {
      tags.add(tag);
    }
  }
  return tags;
}

function hasAnyStructuredForm(text: string): boolean {
  return STRUCTURED_FORM_PATTERNS.some((pattern) => pattern.test(text));
}

function hasDirectMentionSignal(event: CanonicalEvent): boolean {
  return (
    event.trigger_type === "mention" ||
    event.trigger_type === "reply" ||
    event.trigger_type === "quote" ||
    /@\w+/i.test(event.text)
  );
}

function hasExplicitOptInSignal(text: string): boolean {
  return /\bexplicit\s+opt[- ]?in\b/i.test(text) || /\bopt[- ]?in\b/i.test(text);
}

function hasCrossDomainSignal(tags: Set<FrontierDomainTag>): boolean {
  if (tags.has("ai") && tags.has("wetware")) return true;
  if (tags.has("ai") && tags.has("transhuman")) return true;
  if (tags.has("wetware") && tags.has("transhuman")) return true;
  if (tags.has("crypto") && (tags.has("ai") || tags.has("wetware") || tags.has("transhuman"))) return true;
  return tags.size >= 3;
}

export function hasFrontierDomainSignal(text: string): boolean {
  const tags = detectFrontierTags(text);
  if (tags.has("ai") || tags.has("wetware") || tags.has("transhuman")) {
    return true;
  }
  return hasCrossDomainSignal(tags);
}

export function hasEscalatorSignal(args: { event: CanonicalEvent; text: string }): boolean {
  const tags = detectFrontierTags(args.text);
  return (
    hasDirectMentionSignal(args.event) ||
    hasExplicitOptInSignal(args.text) ||
    hasAnyStructuredForm(args.text) ||
    hasCrossDomainSignal(tags)
  );
}

export function hasMarketClusterSignal(text: string): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  return MARKET_CLUSTER_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isConceptualProbe(text: string, context?: { event?: CanonicalEvent }): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const event = context?.event;
  const coreText = stripInvocationPrefix(normalized);
  const tags = detectFrontierTags(coreText);

  if (!hasAnyStructuredForm(coreText)) return false;
  if (!hasFrontierDomainSignal(coreText)) return false;

  return hasEscalatorSignal({
    event:
      event ?? {
        event_id: "conceptual_probe",
        platform: "twitter",
        trigger_type: "manual",
        author_handle: "@unknown",
        author_id: "unknown",
        text,
        parent_text: null,
        quoted_text: null,
        conversation_context: [],
        cashtags: [],
        hashtags: [],
        urls: [],
        timestamp: new Date().toISOString(),
      },
    text: coreText,
  }) || hasCrossDomainSignal(tags);
}

export function isOrchestrationEligibleMinimal(args: {
  event: CanonicalEvent;
  cls: ClassifierOutput;
  scores: ScoreBundle;
}): boolean {
  if (args.cls.intent !== "conceptual_probe") return false;
  if (args.cls.policy_blocked || args.cls.policy_severity === "hard") return false;
  if (args.scores.risk > 0.55) return false;
  return isConceptualProbe(args.event.text, { event: args.event });
}

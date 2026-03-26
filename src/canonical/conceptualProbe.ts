import type { CanonicalEvent, ClassifierOutput, ScoreBundle } from "./types.js";
import { normalizeCanonicalInputText } from "./inputNormalization.js";

type FrontierDomainTag = "ai" | "wetware" | "transhuman" | "crypto" | "structural";

const STRUCTURED_FORM_PATTERNS: RegExp[] = [
  /^\s*what(?:'s|\s+is|\s+are)\b/i,
  /^\s*what\s+(?:actually\s+)?limits\b/i,
  /^\s*what\s+(?:mainly\s+)?limits\b/i,
  /^\s*what\s+most\s+limits\b/i,
  /^\s*what\s+constrains\b/i,
  /^\s*what\s+bottlenecks\b/i,
  /^\s*how do\b/i,
  /^\s*where do\b/i,
  /^\s*why does\b/i,
  /^\s*do you think\b/i,
  /^\s*(?:do|does)\b.*\b(?:structural\s+synergy|narrative\s+overlap|actually\s+fit|actually\s+viable)\b/i,
  /^\s*should humans\b/i,
  /^\s*is there\b.*\bstructural\s+overlap\b/i,
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
      /\bmerging\s+with\s+machines\b/i,
      /\bmerged\s+with\s+machines\b/i,
      /\bhuman[-\s]?machine\s+merge\b/i,
      /\bhumans?\s+and\s+machines\s+merg(?:e|ing|ed)\b/i,
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

const STRUCTURAL_FIT_PATTERNS: RegExp[] = [
  /\bstructural\s+synergy\b/i,
  /\bnarrative\s+overlap\b/i,
  /\bactually\s+viable\b/i,
];

const TRANSHUMAN_MERGE_PATTERNS: RegExp[] = [
  /\bmerge\s+with\s+machines\b/i,
  /\bmerging\s+with\s+machines\b/i,
  /\bmerged\s+with\s+machines\b/i,
  /\bhuman[-\s]?machine\s+merge\b/i,
  /\bhumans?\s+and\s+machines\s+merg(?:e|ing|ed)\b/i,
];

const WETWARE_UTILITY_PATTERNS: RegExp[] = [
  /\bwhat\s+are\s+.+\s+useful\s+for\b/i,
  /\bwhat\s+are\s+.+\s+good\s+for\b/i,
  /\bwhat\s+is\s+.+\s+good\s+for\b/i,
  /\bbeyond\s+hype\b/i,
  /\breal\s+use\s+case\b/i,
  /\bactual\s+use\b/i,
];

const CROSS_DOMAIN_CONVERGENCE_PATTERNS: RegExp[] = [
  /\bhow do\b.*\bconverge\b/i,
  /\bhow do\b.*\bconvergence\b/i,
  /\bwhere do\b.*\bmeet\b/i,
  /\blong\s+term\s+convergence\b/i,
  /\bconverge\b.*\blong\s+term\b/i,
];

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

function stripInvocationPrefix(text: string): string {
  return text
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

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
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
  const normalization = normalizeCanonicalInputText(normalized);
  const syntheticEvent =
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
    };

  for (const candidate of normalization.classifierTextCandidates) {
    const coreText = stripInvocationPrefix(candidate);
    if (!coreText) continue;

    const tags = detectFrontierTags(coreText);
    const structured = hasAnyStructuredForm(coreText) || matchesAny(coreText, [
      ...STRUCTURAL_FIT_PATTERNS,
      ...TRANSHUMAN_MERGE_PATTERNS,
      ...WETWARE_UTILITY_PATTERNS,
      ...CROSS_DOMAIN_CONVERGENCE_PATTERNS,
    ]);
    if (!structured) continue;
    if (!hasFrontierDomainSignal(coreText)) continue;

    if (
      hasEscalatorSignal({
        event: syntheticEvent,
        text: coreText,
      }) ||
      hasCrossDomainSignal(tags) ||
      matchesAny(coreText, STRUCTURAL_FIT_PATTERNS) ||
      matchesAny(coreText, TRANSHUMAN_MERGE_PATTERNS) ||
      matchesAny(coreText, WETWARE_UTILITY_PATTERNS) ||
      matchesAny(coreText, CROSS_DOMAIN_CONVERGENCE_PATTERNS)
    ) {
      return true;
    }
  }

  return false;
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

export interface CanonicalInputNormalization {
  rawText: string;
  strippedPrefixText: string;
  normalizedText: string;
  removedPrefixes: string[];
  optInMarkers: string[];
  classifierTextCandidates: string[];
}

const BOT_HANDLE = (process.env.BOT_USERNAME ?? "organoid_on_sol").replace(/^@/, "");
const escapedBotHandle = BOT_HANDLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LEADING_MENTION_RE = new RegExp(`^(?:@${escapedBotHandle}\\s*)+`, "i");
const LEADING_OPT_IN_RE = /^(?:explicit\s+opt[- ]?in(?:[:\-\s]+)?|opt[- ]?in(?:[:\-\s]+)?)/i;
const TRAILING_OPT_IN_RE = /(?:[\s]*[—–-]\s*|\s+)?(opt[- ]?in)\s*$/i;
const LEADING_DECORATOR_RE = /^[\s:;,\-–—]+/;
const OPENING_FILLER_RE =
  /^(\s*(?:what(?:'s|\s+is|\s+are)?|how|why|do|does|is|are|can|could|should|will|would)\b\s+)(?:actually|really|honestly)\s+/i;

function stripLeadingDecorators(text: string): string {
  return text.replace(LEADING_DECORATOR_RE, "");
}

function stripLeadingPrefixes(text: string): {
  text: string;
  removedPrefixes: string[];
  optInMarkers: string[];
} {
  let working = text.trim();
  const removedPrefixes: string[] = [];
  const optInMarkers: string[] = [];

  while (working.length > 0) {
    const mentionMatch = working.match(LEADING_MENTION_RE);
    if (mentionMatch?.[0]) {
      removedPrefixes.push(mentionMatch[0].trim());
      working = stripLeadingDecorators(working.slice(mentionMatch[0].length));
      continue;
    }

    const optInMatch = working.match(LEADING_OPT_IN_RE);
    if (optInMatch?.[0]) {
      const marker = optInMatch[0].trim().replace(/[:\-\s]+$/, "");
      removedPrefixes.push(marker);
      optInMarkers.push(marker.toLowerCase());
      working = stripLeadingDecorators(working.slice(optInMatch[0].length));
      continue;
    }

    break;
  }

  return {
    text: working.trim(),
    removedPrefixes,
    optInMarkers,
  };
}

function stripTrailingOptInMarker(text: string): {
  text: string;
  optInMarkers: string[];
  removedSuffixes: string[];
} {
  let working = text.trim();
  const optInMarkers: string[] = [];
  const removedSuffixes: string[] = [];

  while (working.length > 0) {
    const markerMatch = working.match(TRAILING_OPT_IN_RE);
    if (!markerMatch?.[1]) {
      break;
    }

    const marker = markerMatch[1].trim();
    optInMarkers.push(marker.toLowerCase());
    removedSuffixes.push(marker);
    working = stripLeadingDecorators(working.slice(0, working.length - markerMatch[0].length));
  }

  return {
    text: working.trim(),
    optInMarkers,
    removedSuffixes,
  };
}

function stripOpeningFiller(text: string): string {
  const match = text.match(OPENING_FILLER_RE);
  if (!match?.[0] || !match[1]) {
    return text.trim();
  }

  return `${match[1]}${text.slice(match[0].length).trimStart()}`.trim();
}

function dedupeTexts(texts: string[]): string[] {
  return texts.map((value) => value.trim()).filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
}

export function normalizeCanonicalInputText(text: string): CanonicalInputNormalization {
  const rawText = text ?? "";
  const {
    text: strippedPrefixText,
    removedPrefixes,
    optInMarkers: leadingOptInMarkers,
  } = stripLeadingPrefixes(rawText);
  const {
    text: suffixStrippedText,
    optInMarkers: trailingOptInMarkers,
    removedSuffixes,
  } = stripTrailingOptInMarker(strippedPrefixText);
  const normalizedText = stripOpeningFiller(suffixStrippedText);
  const optInMarkers = [...leadingOptInMarkers, ...trailingOptInMarkers];
  const classifierTextCandidates = dedupeTexts([
    normalizedText,
    strippedPrefixText,
  ]);

  return {
    rawText,
    strippedPrefixText,
    normalizedText,
    removedPrefixes: [...removedPrefixes, ...removedSuffixes],
    optInMarkers,
    classifierTextCandidates,
  };
}

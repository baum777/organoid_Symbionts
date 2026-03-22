import type { Mention } from "../poller/mentionsMapper.js";
import type { CanonicalEvent, TriggerType } from "../canonical/types.js";
import type { TimelineCandidate } from "./types.js";
import { buildConversationParentRef, type ConversationBundle } from "./conversationBundle.js";

export interface RawTriggerInput {
  triggerType: "mention" | "timeline";
  sourceEventId?: string;
  tweetId: string;
  conversationId?: string;
  authorId?: string;
  parentRef?: ConversationBundle["parentRef"];
  discoveredAt: string;
  rawText?: string;
  metadata?: Record<string, unknown>;
}

export interface EngagementCandidate {
  candidateId: string;
  triggerType: "mention" | "timeline";
  tweetId: string;
  conversationId?: string;
  authorId?: string;
  parentRef?: ConversationBundle["parentRef"];
  normalizedText: string;
  discoveredAt: string;
  sourceMetadata?: Record<string, unknown>;
}

function normalizeText(text: string | undefined): string {
  return text?.trim() ?? "";
}

function readStringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function buildCanonicalEventId(raw: RawTriggerInput): string {
  return raw.sourceEventId ?? raw.tweetId;
}

function buildCanonicalAuthorHandle(candidate: EngagementCandidate): string {
  const fromMetadata =
    readStringMetadata(candidate.sourceMetadata, "authorHandle") ??
    readStringMetadata(candidate.sourceMetadata, "authorUsername");
  if (fromMetadata) {
    return fromMetadata.startsWith("@") ? fromMetadata : `@${fromMetadata}`;
  }

  if (candidate.authorId) {
    return candidate.authorId;
  }

  return "unknown";
}

function extractTextSignals(text: string): {
  cashtags: string[];
  hashtags: string[];
  urls: string[];
} {
  return {
    cashtags: (text.match(/\$[A-Z]{2,10}/gi) ?? []).map((token) => token.toUpperCase()),
    hashtags: text.match(/#\w+/g) ?? [],
    urls: text.match(/https?:\/\/\S+/gi) ?? [],
  };
}

export function buildRawTriggerInputFromMention(
  mention: Mention,
  source: "mentions" | "search"
): RawTriggerInput {
  const parentTweetId = mention.referenced_tweets?.find((ref) => ref.type === "replied_to" || ref.type === "quoted")?.id;
  return {
    triggerType: "mention",
    sourceEventId: mention.id,
    tweetId: mention.id,
    conversationId: mention.conversation_id ?? undefined,
    authorId: mention.author_id,
    parentRef: buildConversationParentRef({
      tweetId: parentTweetId,
      conversationId: mention.conversation_id ?? undefined,
    }),
    discoveredAt: mention.created_at ?? "unknown",
    rawText: mention.text,
    metadata: {
      source,
      authorHandle: mention.authorUsername ? `@${mention.authorUsername.toLowerCase()}` : undefined,
      inReplyToUserId: mention.in_reply_to_user_id ?? undefined,
    },
  };
}

export function buildRawTriggerInputFromTimelineCandidate(candidate: TimelineCandidate): RawTriggerInput {
  return {
    triggerType: "timeline",
    sourceEventId: `timeline:${candidate.tweetId}`,
    tweetId: candidate.tweetId,
    conversationId: candidate.conversationId,
    authorId: candidate.authorId,
    parentRef: buildConversationParentRef({
      tweetId: candidate.referencedTweetIds[0],
      conversationId: candidate.conversationId,
    }),
    discoveredAt: candidate.createdAt,
    rawText: candidate.text,
    metadata: {
      sourceAccount: candidate.sourceAccount,
      authorHandle: candidate.authorUsername ? `@${candidate.authorUsername}` : undefined,
      finalScore: candidate.finalScore,
      selectedBecause: [...candidate.selectedBecause],
      scoreBreakdown: { ...candidate.scoreBreakdown },
      policyDecision: candidate.policyDecision,
    },
  };
}

export function buildEngagementCandidate(raw: RawTriggerInput): EngagementCandidate {
  return {
    candidateId: buildCanonicalEventId(raw),
    triggerType: raw.triggerType,
    tweetId: raw.tweetId,
    conversationId: raw.conversationId,
    authorId: raw.authorId,
    parentRef: raw.parentRef,
    normalizedText: normalizeText(raw.rawText),
    discoveredAt: raw.discoveredAt,
    sourceMetadata: raw.metadata,
  };
}

export function toCanonicalExecutionInput(
  candidate: EngagementCandidate,
  bundle?: ConversationBundle
): CanonicalEvent {
  const signals = extractTextSignals(candidate.normalizedText);
  const triggerType: TriggerType = candidate.triggerType === "mention" ? "mention" : "reply";
  const bundleContext =
    typeof bundle?.sourceMetadata?.context === "string" ? bundle.sourceMetadata.context : undefined;

  return {
    event_id: candidate.candidateId,
    platform: "twitter",
    trigger_type: triggerType,
    author_handle: buildCanonicalAuthorHandle(candidate),
    author_id: candidate.authorId ?? buildCanonicalAuthorHandle(candidate),
    text: candidate.normalizedText,
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: signals.cashtags,
    hashtags: signals.hashtags,
    urls: signals.urls,
    timestamp: candidate.discoveredAt,
    context: bundleContext,
  };
}

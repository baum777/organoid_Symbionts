import type { ConversationParentRef } from "./conversationBundle.js";

/**
 * Raw conversation-context transport lives here and nowhere else.
 * The contract is intentionally narrow: emit fixed, append-only tokens from
 * already-available direct parent fields only.
 */
export const ALLOWED_CONVERSATION_CONTEXT_TOKEN_PREFIXES = [
  "parent_tweet_id",
  "parent_conversation_id",
  "parent_author_id",
] as const;

/**
 * Forbidden categories are policy reminders, not emitted tokens.
 * They are listed here to keep transport raw and non-semantic.
 */
export const FORBIDDEN_CONVERSATION_CONTEXT_TOKEN_CATEGORIES = [
  "dialogue quality judgments",
  "participation judgments",
  "risk judgments",
  "social or intimacy judgments",
  "relevance or scoring judgments",
  "inferred debate state",
  "inferred author role",
  "inferred thread openness or closedness",
  "semantic labels",
] as const;

export type AllowedConversationContextTokenPrefix =
  (typeof ALLOWED_CONVERSATION_CONTEXT_TOKEN_PREFIXES)[number];

export interface ConversationContextTransportInput {
  parentRef?: ConversationParentRef;
}

export function buildRawConversationContextTokens(input: ConversationContextTransportInput): string[] {
  const parentRef = input.parentRef;
  if (!parentRef) {
    return [];
  }

  const tokens: string[] = [];
  if (parentRef.tweetId) {
    tokens.push(`parent_tweet_id:${parentRef.tweetId}`);
  }
  if (parentRef.conversationId) {
    tokens.push(`parent_conversation_id:${parentRef.conversationId}`);
  }
  if (parentRef.authorId) {
    tokens.push(`parent_author_id:${parentRef.authorId}`);
  }

  return tokens;
}

export function isAllowedConversationContextToken(token: string): token is `${AllowedConversationContextTokenPrefix}:${string}` {
  return ALLOWED_CONVERSATION_CONTEXT_TOKEN_PREFIXES.some((prefix) => token.startsWith(`${prefix}:`));
}

import type { EngagementCandidate } from "./candidateBoundary.js";

export interface ConversationSourceTweet {
  tweetId: string;
  conversationId?: string;
  authorId?: string;
  normalizedText?: string;
  discoveredAt?: string;
}

export interface ConversationParentRef {
  tweetId?: string;
  conversationId?: string;
  authorId?: string;
}

export interface ConversationAuthorContext {
  authorId?: string;
  authorHandle?: string;
  sourceAccount?: string;
}

export interface ConversationBundle {
  sourceTweet?: ConversationSourceTweet;
  parentRef?: ConversationParentRef;
  authorContext?: ConversationAuthorContext;
  sourceMetadata?: Record<string, unknown>;
}

export interface ConversationBundleInput {
  candidate: Pick<
    EngagementCandidate,
    "tweetId" | "conversationId" | "authorId" | "normalizedText" | "discoveredAt" | "sourceMetadata"
  >;
  sourceTweet?: ConversationSourceTweet;
  parentRef?: ConversationParentRef;
  authorContext?: ConversationAuthorContext;
  sourceMetadata?: Record<string, unknown>;
}

export interface ConversationParentHint {
  tweetId?: string;
  conversationId?: string;
  authorId?: string;
}

function readString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function buildSourceTweet(input: ConversationBundleInput): ConversationSourceTweet {
  return (
    input.sourceTweet ?? {
      tweetId: input.candidate.tweetId,
      conversationId: input.candidate.conversationId,
      authorId: input.candidate.authorId,
      normalizedText: input.candidate.normalizedText,
      discoveredAt: input.candidate.discoveredAt,
    }
  );
}

function buildAuthorContext(input: ConversationBundleInput): ConversationAuthorContext | undefined {
  if (input.authorContext) {
    return input.authorContext;
  }

  const sourceMetadata = input.sourceMetadata ?? input.candidate.sourceMetadata;
  const authorHandle = readString(sourceMetadata, "authorHandle");
  const sourceAccount = readString(sourceMetadata, "sourceAccount");
  if (!input.candidate.authorId && !authorHandle && !sourceAccount) {
    return undefined;
  }

  return {
    authorId: input.candidate.authorId,
    authorHandle,
    sourceAccount,
  };
}

export function buildConversationParentRef(
  hint: ConversationParentHint | undefined
): ConversationParentRef | undefined {
  if (!hint) {
    return undefined;
  }

  if (!hint.tweetId && !hint.conversationId && !hint.authorId) {
    return undefined;
  }

  return {
    tweetId: hint.tweetId,
    conversationId: hint.conversationId,
    authorId: hint.authorId,
  };
}

export function maybeBuildConversationBundle(input: ConversationBundleInput): ConversationBundle | undefined {
  const bundle: ConversationBundle = {
    sourceTweet: buildSourceTweet(input),
    parentRef: input.parentRef,
    authorContext: buildAuthorContext(input),
  };

  const sourceMetadata = input.sourceMetadata ?? input.candidate.sourceMetadata;
  if (sourceMetadata && Object.keys(sourceMetadata).length > 0) {
    bundle.sourceMetadata = { ...sourceMetadata };
  }

  return bundle;
}

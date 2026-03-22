import { describe, expect, it } from "vitest";
import {
  ALLOWED_CONVERSATION_CONTEXT_TOKEN_PREFIXES,
  FORBIDDEN_CONVERSATION_CONTEXT_TOKEN_CATEGORIES,
  buildRawConversationContextTokens,
  isAllowedConversationContextToken,
} from "../../src/engagement/conversationContextTransport.js";

describe("conversationContextTransport", () => {
  it("keeps the allowed token vocabulary small and raw", () => {
    expect(ALLOWED_CONVERSATION_CONTEXT_TOKEN_PREFIXES).toEqual([
      "parent_tweet_id",
      "parent_conversation_id",
      "parent_author_id",
    ]);
    expect(FORBIDDEN_CONVERSATION_CONTEXT_TOKEN_CATEGORIES).toContain("risk judgments");
    expect(FORBIDDEN_CONVERSATION_CONTEXT_TOKEN_CATEGORIES).toContain("participation judgments");
  });

  it("emits only raw direct-parent transport tokens when parent fields are present", () => {
    const tokens = buildRawConversationContextTokens({
      parentRef: {
        tweetId: "tweet-parent-1",
        conversationId: "conv-parent-1",
        authorId: "author-parent-1",
      },
    });

    expect(tokens).toEqual([
      "parent_tweet_id:tweet-parent-1",
      "parent_conversation_id:conv-parent-1",
      "parent_author_id:author-parent-1",
    ]);
    expect(tokens.every((token) => isAllowedConversationContextToken(token))).toBe(true);
    expect(isAllowedConversationContextToken("thread_open:true")).toBe(false);
    expect(isAllowedConversationContextToken("risk:high")).toBe(false);
    expect(isAllowedConversationContextToken("author_type:researcher")).toBe(false);
  });

  it("stays sparse when no direct parent context is available", () => {
    expect(buildRawConversationContextTokens({})).toEqual([]);
    expect(buildRawConversationContextTokens({ parentRef: undefined })).toEqual([]);
  });
});

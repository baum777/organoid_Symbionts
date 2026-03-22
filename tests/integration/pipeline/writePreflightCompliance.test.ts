import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetStoreCache } from "../../../src/state/storeFactory.js";

vi.mock("../../../src/clients/xApi.js", () => ({
  invokeXApiRequest: vi.fn(async ({ uri }: { uri: string }) => {
    if (uri.includes("/2/tweets/missing")) {
      throw new Error("not found");
    }
    return { data: { id: "tweet-1" } };
  }),
}));

describe("write preflight compliance", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.USE_REDIS = "false";
    resetStoreCache();
  });

  it("blocks missing targets before reserving the interaction", async () => {
    const { runWritePreflight } = await import("../../../src/engagement/writePreflight.js");
    const tweetId = "missing";

    const result = await runWritePreflight({
      source: "mention",
      tweetId,
      authorId: "author-1",
      conversationId: "conv-1",
      verifyTarget: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("TARGET_MISSING");
    }
  });

  it("reserves once and blocks duplicate replay", async () => {
    const { runWritePreflight, markWriteHandled } = await import("../../../src/engagement/writePreflight.js");
    const tweetId = `tweet-${Date.now()}`;

    const first = await runWritePreflight({
      source: "mention",
      tweetId,
      authorId: "author-1",
      conversationId: "conv-1",
      verifyTarget: true,
    });

    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error("expected preflight reservation");
    }

    await markWriteHandled(first.interactionKey);

    const second = await runWritePreflight({
      source: "mention",
      tweetId,
      authorId: "author-1",
      conversationId: "conv-1",
      verifyTarget: true,
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe("ALREADY_REPLIED");
    }
  });
});

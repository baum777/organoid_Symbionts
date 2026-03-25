import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { LLMClient } from "../../../src/clients/llmClient.js";
import { handleEvent } from "../../../src/canonical/pipeline.js";
import { DEFAULT_CANONICAL_CONFIG } from "../../../src/canonical/types.js";
import type { CanonicalEvent } from "../../../src/canonical/types.js";
import { resetEmbodimentsConfigCache } from "../../../src/config/embodimentsConfig.js";
import { clearRegistry } from "../../../src/embodiments/registry.js";
import { loadEmbodiments } from "../../../src/embodiments/loadEmbodiments.js";
import { loadOrganoidShortTermMatrix } from "../../../src/organoid/state.js";
import * as dedupeGuard from "../../../src/ops/dedupeGuard.js";
import * as rateLimiter from "../../../src/ops/rateLimiter.js";
import { resetStoreCache } from "../../../src/state/storeFactory.js";
import { hasEmbodimentGlyphMarker, stripEmbodimentGlyphs } from "../../_helpers/embodimentGlyphs.js";

vi.mock("../../../src/ops/dedupeGuard.js", () => ({
  dedupeCheckAndMark: vi.fn(),
}));
vi.mock("../../../src/ops/rateLimiter.js", () => ({
  enforceLaunchRateLimits: vi.fn(),
}));
vi.mock("../../../src/canonical/auditLog.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/canonical/auditLog.js")>();
  return {
    ...actual,
    persistAuditRecord: vi.fn(),
  };
});

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: "organoid-pipeline-1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@tester",
    author_id: "u1",
    text: "$SOL fake 100x gem with zero proof",
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: ["$SOL"],
    hashtags: [],
    urls: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeMockLLM(reply: string, capture: string[]): LLMClient {
  return {
    generateJSON: vi.fn(async (input: { system: string }) => {
      capture.push(input.system);
      return { reply };
    }),
  };
}

describe("pipeline orchestration", () => {
  let previousOrchestration: string | undefined;
  let previousDataDir: string | undefined;

  beforeEach(async () => {
    previousOrchestration = process.env.EMBODIMENT_ORCHESTRATION_ENABLED;
    previousDataDir = process.env.DATA_DIR;
    process.env.DATA_DIR = join(tmpdir(), `organoid-pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    process.env.EMBODIMENT_ORCHESTRATION_ENABLED = "true";
    process.env.EMBODIMENTS_ENABLED = "true";
    resetStoreCache();
    resetEmbodimentsConfigCache();
    clearRegistry();
    await loadEmbodiments();
    vi.clearAllMocks();
    vi.mocked(dedupeGuard.dedupeCheckAndMark).mockResolvedValue({ ok: true });
    vi.mocked(rateLimiter.enforceLaunchRateLimits).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    if (previousOrchestration === undefined) delete process.env.EMBODIMENT_ORCHESTRATION_ENABLED;
    else process.env.EMBODIMENT_ORCHESTRATION_ENABLED = previousOrchestration;
    if (previousDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previousDataDir;
    resetStoreCache();
    resetEmbodimentsConfigCache();
  });

  it("threads the organoid matrix into the prompt and reply rendering", async () => {
    const captured: string[] = [];
    const deps = {
      llm: makeMockLLM("The frame holds and the claim is still thin.", captured),
      botUserId: "bot",
    };
    const config = {
      ...DEFAULT_CANONICAL_CONFIG,
      refine_enabled: false,
    };

    const result = await handleEvent(makeEvent(), deps, config);
    expect(result.action).toBe("publish");
    if (result.action !== "publish") return;

    expect(captured[0]).toContain("Organoid matrix:");
    expect(captured[0]).toContain("phase:");
    expect(captured[0]).toContain("silence policy:");
    expect(captured[0]).toContain("render policy:");
    expect(hasEmbodimentGlyphMarker(result.reply_text)).toBe(true);
    expect(stripEmbodimentGlyphs(result.reply_text)).toBe("The frame holds and the claim is still thin.");
    expect(result.selectedEmbodimentId).toBeTruthy();
    expect(result.embodimentSelection?.selectedEmbodimentId).toBe(result.selectedEmbodimentId);

    resetStoreCache();
    const matrix = await loadOrganoidShortTermMatrix();
    expect(matrix.lastLeadEmbodimentId).toBe(result.selectedEmbodimentId);
    expect(matrix.lastPhase).not.toBeNull();
  });
});

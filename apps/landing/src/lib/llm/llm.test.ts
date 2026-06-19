import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildLeadPrompt } from "@/lib/llm/prompt";
import {
  __resetLlmClientForTests,
  __setLlmClientForTests,
  createLlmClient,
  getLlmClient,
} from "@/lib/llm/client";
import { practice } from "@/lib/content";

// ── buildLeadPrompt ─────────────────────────────────────────────────

describe("buildLeadPrompt", () => {
  const horizonDrifter = practice.embodiments.find((e) => e.id === "horizon-drifter")!;
  const stabilCore = practice.embodiments.find((e) => e.id === "stabil-core")!;

  it("DE system prompt establishes the embodiment + hard boundaries + budget", () => {
    const { system } = buildLeadPrompt({
      embodiment: horizonDrifter,
      signal: "Soll ich umziehen?",
      context: "life",
      posture: "sachlich",
      locale: "de",
      budget: 160,
    });
    expect(system).toContain("Du bist");
    expect(system).toContain("Horizon-Drifter");
    expect(system).toContain("Nebelspieler");
    expect(system).toContain("KEIN Therapeut");
    expect(system).toContain("160 ZEICHEN");
    expect(system).toContain('"answer"');
  });

  it("EN system prompt uses English boundaries and the EN budget marker", () => {
    const { system } = buildLeadPrompt({
      embodiment: horizonDrifter,
      signal: "Should I move?",
      context: "life",
      posture: "empathisch",
      locale: "en",
      budget: 200,
    });
    expect(system).toContain("You are");
    expect(system).toContain("Horizon-Drifter");
    expect(system).toContain("NOT a therapist");
    expect(system).toContain("200 characters");
    expect(system).toContain('"answer"');
  });

  it("user prompt carries signal, context, posture hint, and embodiment name", () => {
    const deUser = buildLeadPrompt({
      embodiment: stabilCore,
      signal: "Mein Vater hat mir nie gesagt, dass er stolz ist.",
      context: "reflection",
      posture: "empathisch",
      locale: "de",
      budget: 200,
    }).user;
    expect(deUser).toContain("Reflexion");
    expect(deUser).toContain("Validieren, dann öffnen");
    expect(deUser).toContain("Mein Vater hat mir nie gesagt");
    expect(deUser).toContain("Stabil-Core");
    expect(deUser).toContain("Stillhalter");

    const enUser = buildLeadPrompt({
      embodiment: stabilCore,
      signal: "My father never said he was proud of me.",
      context: "reflection",
      posture: "konfrontativ",
      locale: "en",
      budget: 240,
    }).user;
    expect(enUser).toContain("Reflection");
    expect(enUser).toContain("Ask directly");
    expect(enUser).toContain("My father never said");
  });

  it("per-posture budget is interpolated as a number, not a template placeholder", () => {
    const { system, user } = buildLeadPrompt({
      embodiment: horizonDrifter,
      signal: "x",
      context: "life",
      posture: "konfrontativ",
      locale: "de",
      budget: 240,
    });
    expect(system).toContain("240 ZEICHEN");
    expect(system).not.toContain("{budget}");
    expect(user).toContain("240 Zeichen");
    expect(user).not.toContain("{budget}");
  });
});

// ── createLlmClient factory ─────────────────────────────────────────

describe("createLlmClient", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.XAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODEL;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns null when the provider is undefined", () => {
    expect(createLlmClient(undefined)).toBeNull();
  });

  it("returns null for an unknown provider name", () => {
    expect(createLlmClient("gemini")).toBeNull();
    expect(createLlmClient("")).toBeNull();
  });

  it("returns an xai client when XAI_API_KEY is set", () => {
    process.env.XAI_API_KEY = "test-xai-key";
    const c = createLlmClient("xai");
    expect(c).not.toBeNull();
    expect(c?.provider).toBe("xai");
    expect(c?.modelVersion).toBe("grok-3");
  });

  it("returns an anthropic client when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    const c = createLlmClient("anthropic");
    expect(c).not.toBeNull();
    expect(c?.provider).toBe("anthropic");
    expect(c?.modelVersion).toBe("claude-3-5-sonnet-latest");
  });

  it("returns an openai client when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const c = createLlmClient("openai");
    expect(c).not.toBeNull();
    expect(c?.provider).toBe("openai");
    expect(c?.modelVersion).toBe("gpt-4o");
  });

  it("honours LLM_MODEL override for any provider", () => {
    process.env.XAI_API_KEY = "test-xai-key";
    process.env.LLM_MODEL = "grok-3-mini";
    const c = createLlmClient("xai");
    expect(c?.modelVersion).toBe("grok-3-mini");
  });

  it("throws LlmError(missing_api_key) when the provider's key is unset", () => {
    expect(() => createLlmClient("xai")).toThrow(/XAI_API_KEY/);
    expect(() => createLlmClient("anthropic")).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => createLlmClient("openai")).toThrow(/OPENAI_API_KEY/);
  });

  it("provider name is matched case-insensitively", () => {
    process.env.XAI_API_KEY = "test-xai-key";
    expect(createLlmClient("XAI")?.provider).toBe("xai");
    expect(createLlmClient("Xai")?.provider).toBe("xai");
  });
});

// ── getLlmClient singleton + test injection ─────────────────────────

describe("getLlmClient", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.LLM_PROVIDER;
    delete process.env.XAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    __resetLlmClientForTests();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    __resetLlmClientForTests();
  });

  it("returns null when LLM_PROVIDER is unset (default dev/test behaviour)", () => {
    expect(getLlmClient()).toBeNull();
  });

  it("caches the resolved client — second call returns the same instance", () => {
    process.env.LLM_PROVIDER = "xai";
    process.env.XAI_API_KEY = "test-key";
    const a = getLlmClient();
    const b = getLlmClient();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it("caches null on missing-key error — second call does not throw", () => {
    process.env.LLM_PROVIDER = "xai";
    // XAI_API_KEY is unset → createLlmClient throws. getLlmClient
    // catches the throw and caches null so the runner can fall back
    // to the stub on every call instead of failing once and succeeding
    // once (the latter would be a worse UX for the client).
    expect(getLlmClient()).toBeNull();
    expect(getLlmClient()).toBeNull();
  });

  it("__setLlmClientForTests bypasses env resolution", () => {
    const fake = {
      provider: "fake",
      modelVersion: "fake-v1",
      async complete() {
        return { text: "{}", modelVersion: "fake-v1" };
      },
    };
    __setLlmClientForTests(fake);
    expect(getLlmClient()).toBe(fake);
  });

  it("__setLlmClientForTests(null) sets the cache to null", () => {
    __setLlmClientForTests(null);
    expect(getLlmClient()).toBeNull();
  });

  it("__resetLlmClientForTests re-resolves from env", () => {
    process.env.LLM_PROVIDER = "xai";
    process.env.XAI_API_KEY = "test-key";
    const first = getLlmClient();
    __resetLlmClientForTests();
    const second = getLlmClient();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    // different instances — cache was reset
    expect(first).not.toBe(second);
  });
});

// LLM client factory + cached singleton + test injection.
//
// createLlmClient(provider) is the pure factory: it reads
// env, returns a client, or throws on missing key. The
// runner never calls createLlmClient directly — it goes
// through getLlmClient() which lazily resolves a singleton
// from LLM_PROVIDER.
//
// If LLM_PROVIDER is unset / unknown, getLlmClient() returns
// null and the runner falls back to the deterministic stub.
// This keeps local dev (no API key) cheap and deterministic.
//
// Tests inject a mock via __setLlmClientForTests; that
// bypasses env entirely.

import type { LlmClient } from "@/lib/llm/types";
import { createAnthropicClient } from "@/lib/llm/providers/anthropic";
import { createOpenAIClient } from "@/lib/llm/providers/openai";
import { createXaiClient } from "@/lib/llm/providers/xai";

export function createLlmClient(provider: string | undefined): LlmClient | null {
  if (!provider) return null;
  switch (provider.toLowerCase()) {
    case "xai":
      return createXaiClient();
    case "anthropic":
      return createAnthropicClient();
    case "openai":
      return createOpenAIClient();
    default:
      return null;
  }
}

let cached: LlmClient | null | undefined;

export function getLlmClient(): LlmClient | null {
  if (cached === undefined) {
    try {
      cached = createLlmClient(process.env.LLM_PROVIDER);
    } catch {
      // Missing API key or other env error → fall back to stub.
      cached = null;
    }
  }
  return cached;
}

export function __setLlmClientForTests(client: LlmClient | null): void {
  cached = client;
}

export function __resetLlmClientForTests(): void {
  cached = undefined;
}

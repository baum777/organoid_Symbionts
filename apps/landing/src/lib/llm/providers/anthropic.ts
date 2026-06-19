// Anthropic (Claude) provider — Messages API.
//
// Env: ANTHROPIC_API_KEY. Optional LLM_MODEL override
// (default claude-3-5-sonnet-latest). Endpoint:
// https://api.anthropic.com/v1/messages. The system prompt is
// a top-level field, not a message — different shape than the
// OpenAI-compatible providers.

import { LlmError, type LlmClient, type LlmRequest, type LlmResult } from "@/lib/llm/types";

const DEFAULT_MODEL = "claude-3-5-sonnet-latest";
const ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export function createAnthropicClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmError("ANTHROPIC_API_KEY is not set", "missing_api_key", "anthropic");
  }
  const modelVersion = process.env.LLM_MODEL ?? DEFAULT_MODEL;

  return {
    provider: "anthropic",
    modelVersion,

    async complete(request: LlmRequest): Promise<LlmResult> {
      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model: modelVersion,
            system: request.system,
            messages: [{ role: "user", content: request.user }],
            max_tokens: Math.max(16, Math.ceil(request.maxTokens / 4)),
            temperature: request.temperature,
          }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new LlmError(`Anthropic network error: ${msg}`, "network_error", "anthropic");
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "<no body>");
        throw new LlmError(
          `Anthropic HTTP ${response.status}: ${text.slice(0, 200)}`,
          "http_error",
          "anthropic",
          response.status,
        );
      }

      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const block = data.content?.find((b) => b.type === "text");
      const content = block?.text;
      if (typeof content !== "string" || content.length === 0) {
        throw new LlmError("Anthropic returned empty content", "invalid_response", "anthropic");
      }
      return { text: content, modelVersion };
    },
  };
}

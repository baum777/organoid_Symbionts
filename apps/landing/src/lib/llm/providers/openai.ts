// OpenAI provider — standard chat completions.
//
// Env: OPENAI_API_KEY. Optional LLM_MODEL override (default gpt-4o).
// Endpoint: https://api.openai.com/v1/chat/completions

import { LlmError, type LlmClient, type LlmRequest, type LlmResult } from "@/lib/llm/types";

const DEFAULT_MODEL = "gpt-4o";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export function createOpenAIClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LlmError("OPENAI_API_KEY is not set", "missing_api_key", "openai");
  }
  const modelVersion = process.env.LLM_MODEL ?? DEFAULT_MODEL;

  return {
    provider: "openai",
    modelVersion,

    async complete(request: LlmRequest): Promise<LlmResult> {
      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelVersion,
            messages: [
              { role: "system", content: request.system },
              { role: "user", content: request.user },
            ],
            max_tokens: Math.max(16, Math.ceil(request.maxTokens / 4)),
            temperature: request.temperature,
            response_format: { type: "json_object" },
          }),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new LlmError(`OpenAI network error: ${msg}`, "network_error", "openai");
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "<no body>");
        throw new LlmError(
          `OpenAI HTTP ${response.status}: ${text.slice(0, 200)}`,
          "http_error",
          "openai",
          response.status,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new LlmError("OpenAI returned empty content", "invalid_response", "openai");
      }
      return { text: content, modelVersion };
    },
  };
}

import type { LLMClient, LLMRequest } from "../llmClient.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Llama-3.2-1B via OpenRouter — secondary cloud fallback.
 * Used when both Ollama (local) and OpenRouter-LFM25 are unavailable.
 */
export function createOpenRouterLlama1BClient(apiKey: string): LLMClient {
  return {
    async generateJSON<T>(input: LLMRequest): Promise<T> {
      const model =
        process.env.OPENROUTER_LLAMA1B_MODEL || "meta-llama/llama-3.2-1b-instruct:free";

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://organoid-symbionts.app",
          "X-Title": process.env.OPENROUTER_TITLE || "organoid_Symbionts",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: [input.system, input.developer].filter(Boolean).join("\n\n") },
            { role: "user", content: input.user },
          ],
          response_format: { type: "json_object" },
          temperature: input.temperature ?? 0.1,
          max_tokens: input.max_tokens ?? 64,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`openrouter-llama-1b: ${res.status} ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new Error("openrouter-llama-1b: empty response content");
      }
      return JSON.parse(content) as T;
    },
  };
}

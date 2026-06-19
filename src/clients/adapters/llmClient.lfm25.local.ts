import type { LLMClient, LLMRequest } from "../llmClient.js";

/**
 * LFM2.5-1.2B local adapter — talks to an Ollama sidecar service.
 *
 * Endpoint: POST {LFM25_LOCAL_URL}/api/chat
 * Request shape: Ollama native chat API with `format: "json"`.
 * Model tag defaults to "lfm2.5:1.2b-instruct" (Ollama registry).
 */
export function createLFM25LocalClient(): LLMClient {
  return {
    async generateJSON<T>(input: LLMRequest): Promise<T> {
      const endpoint = process.env.LFM25_LOCAL_URL || "http://localhost:11434";
      const model = process.env.LFM25_LOCAL_MODEL || "lfm2.5:1.2b-instruct";

      const res = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: [input.system, input.developer].filter(Boolean).join("\n\n") },
            { role: "user", content: input.user },
          ],
          format: "json",
          options: {
            temperature: input.temperature ?? 0.1,
            num_predict: input.max_tokens ?? 64,
          },
          stream: false,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`lfm25-local: ${res.status} ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      const content = data?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new Error("lfm25-local: empty response content");
      }
      return JSON.parse(content) as T;
    },
  };
}

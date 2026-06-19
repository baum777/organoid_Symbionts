import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOpenRouterLlama1BClient } from "../../../src/clients/adapters/llmClient.openrouterLlama1b.js";

describe("openrouterLlama1b adapter", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
    process.env.OPENROUTER_API_KEY = "sk-or-test-key";
    process.env.OPENROUTER_LLAMA1B_MODEL = "meta-llama/llama-3.2-1b-instruct:free";
    process.env.OPENROUTER_REFERER = "https://test.app";
    process.env.OPENROUTER_TITLE = "test_app";
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_LLAMA1B_MODEL;
    delete process.env.OPENROUTER_REFERER;
    delete process.env.OPENROUTER_TITLE;
  });

  it("happy path: parses JSON response and sends auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"intent":"question","confidence":0.8}' } }],
      }),
    } as unknown as Response);

    const client = createOpenRouterLlama1BClient("sk-or-test-key");
    const result = await client.generateJSON<{ intent: string }>({
      system: "sys",
      developer: "dev",
      user: "hi",
    });

    expect(result.intent).toBe("question");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-or-test-key");
  });

  it("uses input.temperature and input.max_tokens when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLlama1BClient("sk-or-test-key");
    await client.generateJSON({
      system: "s",
      developer: "d",
      user: "u",
      temperature: 0.3,
      max_tokens: 200,
    });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(200);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.model).toBe("meta-llama/llama-3.2-1b-instruct:free");
  });

  it("non-2xx response throws with status code in message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "server error",
    } as unknown as Response);

    const client = createOpenRouterLlama1BClient("sk-or-test-key");
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow(/openrouter-llama-1b: 500/);
  });

  it("invalid JSON in response throws", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "garbage" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLlama1BClient("sk-or-test-key");
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow();
  });

  it("uses default model when env var unset", async () => {
    delete process.env.OPENROUTER_LLAMA1B_MODEL;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLlama1BClient("sk-or-test-key");
    await client.generateJSON({ system: "s", developer: "d", user: "u" });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("meta-llama/llama-3.2-1b-instruct:free");
  });
});

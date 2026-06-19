import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOpenRouterLFM25Client } from "../../../src/clients/adapters/llmClient.openrouterLfm25.js";

describe("openrouterLfm25 adapter", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
    process.env.OPENROUTER_API_KEY = "sk-or-test-key";
    process.env.OPENROUTER_LFM25_MODEL = "liquid/lfm-2.5-1.2b-instruct:free";
    process.env.OPENROUTER_REFERER = "https://test.app";
    process.env.OPENROUTER_TITLE = "test_app";
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_LFM25_MODEL;
    delete process.env.OPENROUTER_REFERER;
    delete process.env.OPENROUTER_TITLE;
  });

  it("happy path: parses JSON response and sends auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"intent":"greeting","confidence":0.9}' } }],
      }),
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    const result = await client.generateJSON<{ intent: string }>({
      system: "sys",
      developer: "dev",
      user: "hello",
    });

    expect(result.intent).toBe("greeting");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-or-test-key");
    expect(headers["HTTP-Referer"]).toBe("https://test.app");
    expect(headers["X-Title"]).toBe("test_app");
  });

  it("uses input.temperature and input.max_tokens when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    await client.generateJSON({
      system: "s",
      developer: "d",
      user: "u",
      temperature: 0.5,
      max_tokens: 256,
    });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(256);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.model).toBe("liquid/lfm-2.5-1.2b-instruct:free");
  });

  it("non-2xx response throws with status code in message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow(/openrouter-lfm25: 429/);
  });

  it("invalid JSON in response throws", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "not json" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow();
  });

  it("empty choices throws", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [] }),
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow(/empty response content/);
  });

  it("uses default model when env var unset", async () => {
    delete process.env.OPENROUTER_LFM25_MODEL;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    } as unknown as Response);

    const client = createOpenRouterLFM25Client("sk-or-test-key");
    await client.generateJSON({ system: "s", developer: "d", user: "u" });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("liquid/lfm-2.5-1.2b-instruct:free");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLFM25LocalClient } from "../../../src/clients/adapters/llmClient.lfm25.local.js";

describe("lfm25Local adapter", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
    process.env.LFM25_LOCAL_URL = "http://test-ollama:11434";
    process.env.LFM25_LOCAL_MODEL = "lfm2.5:1.2b-instruct";
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.LFM25_LOCAL_URL;
    delete process.env.LFM25_LOCAL_MODEL;
  });

  it("happy path: parses JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: '{"intent":"greeting","confidence":0.9}' } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    const result = await client.generateJSON<{ intent: string; confidence: number }>({
      system: "sys",
      developer: "dev",
      user: "hello",
    });

    expect(result.intent).toBe("greeting");
    expect(result.confidence).toBeCloseTo(0.9);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://test-ollama:11434/api/chat");
    expect(init.method).toBe("POST");
  });

  it("uses input.temperature and input.max_tokens when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "{}" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await client.generateJSON({
      system: "s",
      developer: "d",
      user: "u",
      temperature: 0.7,
      max_tokens: 128,
    });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.options.temperature).toBe(0.7);
    expect(body.options.num_predict).toBe(128);
  });

  it("uses default temperature 0.1 and max_tokens 64 when omitted", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "{}" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await client.generateJSON({ system: "s", developer: "d", user: "u" });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.options.temperature).toBe(0.1);
    expect(body.options.num_predict).toBe(64);
  });

  it("merges system and developer into a single system role", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "{}" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await client.generateJSON({
      system: "SYSTEM_BLOCK",
      developer: "DEV_BLOCK",
      user: "u",
    });

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("SYSTEM_BLOCK");
    expect(body.messages[0].content).toContain("DEV_BLOCK");
    expect(body.messages[1].role).toBe("user");
    expect(body.messages[1].content).toBe("u");
  });

  it("non-2xx response throws with status code in message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "service unavailable",
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow(/lfm25-local: 503/);
  });

  it("invalid JSON in response throws", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "not json" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow();
  });

  it("empty content throws", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await expect(
      client.generateJSON({ system: "s", developer: "d", user: "u" }),
    ).rejects.toThrow(/empty response content/);
  });

  it("falls back to localhost:11434 when env var is unset", async () => {
    delete process.env.LFM25_LOCAL_URL;
    delete process.env.LFM25_LOCAL_MODEL;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "{}" } }),
    } as unknown as Response);

    const client = createLFM25LocalClient();
    await client.generateJSON({ system: "s", developer: "d", user: "u" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/api/chat");
    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("lfm2.5:1.2b-instruct");
  });
});

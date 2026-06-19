// LLM provider abstraction for the /api/consult endpoint.
//
// The runner picks the lead / counterweight / anchor (per
// CONTEXT_PHASE) and asks the LLM to draft the lead answer
// only. The counterweight and anchor keep using the
// sampleQuote — a smaller LLM surface means fewer
// voice-rule violations and lower cost.
//
// Interface is shaped so a new provider is a single file under
// providers/ + one entry in client.ts. No SDK is used; all
// providers use native fetch (Node 20+).

export type LlmMessage = {
  role: "system" | "user";
  content: string;
};

export type LlmRequest = {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
};

export type LlmResult = {
  text: string;
  modelVersion: string;
};

export type LlmErrorCode =
  | "missing_api_key"
  | "http_error"
  | "invalid_response"
  | "network_error";

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly code: LlmErrorCode,
    public readonly provider: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export interface LlmClient {
  /** Provider id (xai / anthropic / openai) — also the modelVersion prefix. */
  readonly provider: string;
  /** Resolved model name (e.g. grok-3, claude-3-5-sonnet-latest, gpt-4o). */
  readonly modelVersion: string;
  complete(request: LlmRequest): Promise<LlmResult>;
}

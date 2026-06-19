import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyWithPreLLM,
  classifyWithRules,
  selectPreLLMProvider,
  selectPreLLMFallback,
  applyHardGuards,
  FORBIDDEN_INTERNAL_TOKENS,
  emptyResult,
  type PreLLMResult,
} from "../../src/canonical/preLLMClassifier.js";
import type { LLMClient } from "../../src/clients/llmClient.js";

const ORIGINAL_ENV = { ...process.env };

function makeMockClient(returns: Partial<PreLLMResult>): LLMClient {
  return {
    generateJSON: vi.fn(async () => returns),
  };
}

function makeFailingClient(): LLMClient {
  return {
    generateJSON: vi.fn(async () => {
      throw new Error("network down");
    }),
  };
}

describe("classifyWithRules", () => {
  it("detects crisis in DE and EN", () => {
    const de = classifyWithRules("ich halte das nicht mehr aus, alles ist sinnlos");
    expect(de.crisis_flag).toBe(true);

    const en = classifyWithRules("ending it all tonight, no point");
    expect(en.crisis_flag).toBe(true);
  });

  it("detects buy language as violation", () => {
    const r = classifyWithRules("you should buy $SOL right now");
    expect(r.violation_flags).toContain("buy_sell_language");
    expect(r.tokens).toContain("SOL");
  });

  it("detects question intent from ? suffix", () => {
    const r = classifyWithRules("wie ist dein Take zu meinem $SOL?");
    expect(r.intent).toBe("question");
    expect(r.target_class).toBe("token");
  });

  it("detects DE language from German umlauts", () => {
    const r = classifyWithRules("Gr\u00fc\u00dfe aus Berlin");
    expect(r.language).toBe("de");
  });

  it("extracts cashtags without $", () => {
    const r = classifyWithRules("$SOL today strong, $ETH weak");
    expect(r.tokens).toEqual(expect.arrayContaining(["SOL", "ETH"]));
    expect(r.target_class).toBe("token");
  });

  it("extracts Solana contract addresses", () => {
    const r = classifyWithRules("checkt mal 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    expect(r.contract_addresses.length).toBeGreaterThanOrEqual(1);
    expect(r.contract_addresses[0]).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  it("detects DE language from umlauts", () => {
    const r = classifyWithRules("der markt ist heute ruhig, alles grün");
    expect(r.language).toBe("de");
  });

  it("defaults to EN language when no DE markers", () => {
    const r = classifyWithRules("market is dead today, total scam vibes");
    expect(r.language).toBe("en");
  });

  it("defaults intent to casual_ping when no signals", () => {
    const r = classifyWithRules("gm everyone");
    expect(r.intent).toBe("casual_ping");
    expect(r.confidence).toBe(0.5);
  });

  it("flags internal tokens defensively", () => {
    const r = classifyWithRules("dieses modell hat score 95 und ist mythic rare");
    expect(r.contains_internal_token).toBe(true);
    expect(r.internal_violations).toContain("score");
    expect(r.internal_violations).toContain("mythic");
  });

  it("marks provider as rule-based", () => {
    const r = classifyWithRules("hello world");
    expect(r.provider).toBe("rule-based");
  });
});

describe("applyHardGuards (defensive internal-token backfill)", () => {
  it("adds internal violations the LLM missed", () => {
    const partial: PreLLMResult = {
      ...emptyResult("lfm25-local"),
      intent: "question",
      confidence: 0.7,
    };
    const r = applyHardGuards(partial, "the score is 95 and rarity is mythic");
    expect(r.contains_internal_token).toBe(true);
    expect(r.internal_violations).toEqual(expect.arrayContaining(["score", "rarity", "mythic"]));
  });

  it("does not duplicate existing internal violations", () => {
    const partial: PreLLMResult = {
      ...emptyResult("lfm25-local"),
      intent: "question",
      confidence: 0.7,
      internal_violations: ["score"],
    };
    const r = applyHardGuards(partial, "the score is high");
    expect(r.internal_violations.filter((v) => v === "score").length).toBe(1);
  });

  it("is no-op when no internal tokens present", () => {
    const partial: PreLLMResult = {
      ...emptyResult("lfm25-local"),
      intent: "greeting",
      confidence: 0.9,
    };
    const r = applyHardGuards(partial, "hello world");
    expect(r.contains_internal_token).toBe(false);
    expect(r.internal_violations.length).toBe(0);
  });

  it("FORBIDDEN_INTERNAL_TOKENS has the expected internal-token list", () => {
    expect(FORBIDDEN_INTERNAL_TOKENS).toContain("score");
    expect(FORBIDDEN_INTERNAL_TOKENS).toContain("mythic");
    expect(FORBIDDEN_INTERNAL_TOKENS).toContain("rarity");
    expect(FORBIDDEN_INTERNAL_TOKENS).toContain("hash");
    expect(FORBIDDEN_INTERNAL_TOKENS.length).toBeGreaterThanOrEqual(15);
  });
});

describe("classifyWithPreLLM (LLM path)", () => {
  it("returns merged result with provider tag", async () => {
    const client = makeMockClient({
      intent: "market_question_general",
      confidence: 0.9,
      target_class: "market_structure",
      language: "de",
      crisis_flag: false,
    });
    const r = await classifyWithPreLLM("wie wird das wetter im markt?", client, "lfm25-local");
    expect(r.intent).toBe("market_question_general");
    expect(r.confidence).toBe(0.9);
    expect(r.target_class).toBe("market_structure");
    expect(r.language).toBe("de");
    expect(r.provider).toBe("lfm25-local");
  });

  it("defensively adds internal tokens even if LLM missed them", async () => {
    const client = makeMockClient({
      intent: "question",
      confidence: 0.8,
      target_class: "claim",
    });
    const r = await classifyWithPreLLM("what is the score here?", client);
    expect(r.contains_internal_token).toBe(true);
    expect(r.internal_violations).toContain("score");
  });

  it("propagates LLM errors as thrown exceptions", async () => {
    const client = makeFailingClient();
    await expect(classifyWithPreLLM("hi", client)).rejects.toThrow(/network down/);
  });

  it("passes through tokens/contract_addresses from LLM", async () => {
    const client = makeMockClient({
      intent: "own_token_sentiment",
      confidence: 0.9,
      tokens: ["SOL", "ETH"],
      sentiment_per_token: { SOL: "bullish", ETH: "bearish" },
      contract_addresses: ["7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"],
    });
    const r = await classifyWithPreLLM("$SOL bullish, $ETH bearish", client);
    expect(r.tokens).toEqual(["SOL", "ETH"]);
    expect(r.sentiment_per_token).toEqual({ SOL: "bullish", ETH: "bearish" });
    expect(r.contract_addresses.length).toBe(1);
  });
});

describe("selectPreLLMProvider / selectPreLLMFallback", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to lfm25-local when env unset", () => {
    delete process.env.PIPELINE_PRE_LLM_PROVIDER;
    expect(selectPreLLMProvider()).toBe("lfm25-local");
  });

  it("demotes xai to rule-based (cost gate)", () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "xai";
    expect(selectPreLLMProvider()).toBe("rule-based");
  });

  it("returns openrouter-lfm25 when configured", () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "openrouter-lfm25";
    expect(selectPreLLMProvider()).toBe("openrouter-lfm25");
  });

  it("returns openrouter-llama-1b when configured", () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "openrouter-llama-1b";
    expect(selectPreLLMProvider()).toBe("openrouter-llama-1b");
  });

  it("returns rule-based when configured", () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "rule-based";
    expect(selectPreLLMProvider()).toBe("rule-based");
  });

  it("falls back to lfm25-local on unknown value", () => {
    process.env.PIPELINE_PRE_LLM_PROVIDER = "garbage-provider";
    expect(selectPreLLMProvider()).toBe("lfm25-local");
  });

  it("fallback defaults to openrouter-llama-1b", () => {
    delete process.env.PIPELINE_PRE_LLM_FALLBACK;
    expect(selectPreLLMFallback()).toBe("openrouter-llama-1b");
  });

  it("fallback returns rule-based when configured", () => {
    process.env.PIPELINE_PRE_LLM_FALLBACK = "rule-based";
    expect(selectPreLLMFallback()).toBe("rule-based");
  });
});

describe("integration: classifyWithRules result schema", () => {
  it("result conforms to PreLLMResult shape", () => {
    const r = classifyWithRules("hello world");
    const requiredKeys: (keyof PreLLMResult)[] = [
      "intent",
      "confidence",
      "target_class",
      "language",
      "crisis_flag",
      "violation_flags",
      "tokens",
      "contract_addresses",
      "sentiment_per_token",
      "contains_internal_token",
      "internal_violations",
      "provider",
    ];
    for (const k of requiredKeys) {
      expect(r).toHaveProperty(k);
    }
  });
});

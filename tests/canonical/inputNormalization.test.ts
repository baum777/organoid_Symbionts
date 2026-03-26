import { describe, expect, it } from "vitest";
import { normalizeCanonicalInputText } from "../../src/canonical/inputNormalization.js";

describe("canonical input normalization", () => {
  it("strips a leading bot mention for greeting text", () => {
    const normalized = normalizeCanonicalInputText("@organoid_on_sol gm");

    expect(normalized.rawText).toBe("@organoid_on_sol gm");
    expect(normalized.strippedPrefixText).toBe("gm");
    expect(normalized.normalizedText).toBe("gm");
    expect(normalized.removedPrefixes).toContain("@organoid_on_sol");
  });

  it("strips a mention prefix for conceptual questions without mutating raw text", () => {
    const raw = "@organoid_on_sol what actually limits current LLM systems the most?";
    const normalized = normalizeCanonicalInputText(raw);

    expect(normalized.rawText).toBe(raw);
    expect(normalized.strippedPrefixText).toBe("what actually limits current LLM systems the most?");
    expect(normalized.normalizedText).toBe("what limits current LLM systems the most?");
  });

  it("records explicit opt-in markers while removing them from the classifier text", () => {
    const normalized = normalizeCanonicalInputText("curious for your take — opt-in");

    expect(normalized.optInMarkers).toContain("opt-in");
    expect(normalized.normalizedText).toBe("curious for your take");
    expect(normalized.classifierTextCandidates).toContain("curious for your take");
  });

  it("keeps filler normalization conservative", () => {
    const normalized = normalizeCanonicalInputText("what actually limits current LLM systems the most?");

    expect(normalized.normalizedText).toBe("what limits current LLM systems the most?");
    expect(normalized.strippedPrefixText).toBe("what actually limits current LLM systems the most?");
  });
});

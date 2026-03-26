import { describe, expect, it } from "vitest";
import { expandLore } from "../../src/lore/loreExpansionEngine.js";
import { generateLoreCandidates } from "../../src/lore/loreCandidateGenerator.js";

describe("lore candidate generation", () => {
  it("generates bounded, review-only candidates from motifs", () => {
    const candidates = generateLoreCandidates(
      [" Resonance drift ", "onchain proof", "onchain proof"],
      { enabled: true, maxCandidates: 2, createdAt: "2026-03-24T00:00:00.000Z" },
    );

    expect(candidates).toHaveLength(2);
    expect(candidates[0]?.source_motif).toBe("resonance drift");
    expect(candidates[0]?.status).toBe("candidate");
    expect(candidates[0]?.created_at).toBe("2026-03-24T00:00:00.000Z");
    expect(candidates[0]?.content).toContain("measured runtime signal");
    expect(candidates[1]?.content).toContain("schema-checked proof");
    expect(candidates.map((candidate) => candidate.id)).toHaveLength(2);
    expect(new Set(candidates.map((candidate) => candidate.id)).size).toBe(2);
  });

  it("returns no candidates when disabled", () => {
    expect(generateLoreCandidates(["resonance"], { enabled: false })).toEqual([]);
  });

  it("expands lore into candidates and rejected motifs deterministically", async () => {
    const result = await expandLore(["consent ritual", "meme entry surface"], {
      enabled: true,
      maxCandidates: 1,
      createdAt: "2026-03-24T00:00:00.000Z",
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.source_motif).toBe("consent ritual");
    expect(result.rejected).toContain("meme entry surface");
  });
});

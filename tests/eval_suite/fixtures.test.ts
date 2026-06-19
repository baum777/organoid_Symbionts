import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SUITE_DIR = resolve(__dirname, "..", "..", "llm_test_database_bundle", "eval_suite");
const EMBODIMENT_DIR = resolve(__dirname, "..", "..", "data", "embodiments");

const FILES = {
  pre_llm: join(SUITE_DIR, "pre_llm_classifier.jsonl"),
  reasoning: join(SUITE_DIR, "reasoning_orchestrator.jsonl"),
  generation: join(SUITE_DIR, "generation_embodiment_voice.jsonl"),
} as const;

const JUDGE_PROMPT = join(SUITE_DIR, "voice_judge_prompt.txt");

const ALLOWED_TIERS = new Set(["pre_llm", "reasoning", "generation"]);

const FILE_TO_TIER: Record<keyof typeof FILES, string> = {
  pre_llm: "pre_llm",
  reasoning: "reasoning",
  generation: "generation",
};

const MIN_COUNTS: Record<keyof typeof FILES, number> = {
  pre_llm: 15,
  reasoning: 10,
  generation: 14,
};

interface Fixture {
  name: string;
  tier: string;
  category: string;
  input: unknown;
  expect_json: boolean;
  max_chars: number;
  scoring_rubric: string;
  target_embodiment?: string;
  expected_lead?: string;
  forbidden_canon_tokens?: string[];
  forbidden_internal_tokens?: string[];
  [key: string]: unknown;
}

function loadFixtures(path: string): Fixture[] {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return lines.map((line) => JSON.parse(line) as Fixture);
}

const REQUIRED_FIELDS: (keyof Fixture)[] = [
  "name",
  "tier",
  "category",
  "input",
  "expect_json",
  "max_chars",
  "scoring_rubric",
];

describe("eval_suite fixtures", () => {
  it("all 3 JSONL files exist and parse cleanly", () => {
    for (const [label, path] of Object.entries(FILES)) {
      expect(existsSync(path), `${label} file missing at ${path}`).toBe(true);
      const fixtures = loadFixtures(path);
      expect(fixtures.length, `${label} parsed fixtures count`).toBeGreaterThan(0);
      for (const fx of fixtures) {
        expect(typeof fx, `${label} fixture should be an object`).toBe("object");
        expect(fx, `${label} fixture should not be null`).not.toBeNull();
      }
    }
  });

  it("each JSONL line is a single valid JSON object (no trailing commas, no multi-object lines)", () => {
    for (const [label, path] of Object.entries(FILES)) {
      const text = readFileSync(path, "utf8");
      const lines = text.split("\n").filter((line) => line.trim().length > 0);
      lines.forEach((line, idx) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch (e: unknown) {
          throw new Error(
            `${label} line ${idx + 1} failed to parse as JSON: ${(e as Error).message}\nLine: ${line}`,
          );
        }
        expect(typeof parsed, `${label} line ${idx + 1} should parse to object`).toBe("object");
        expect(parsed, `${label} line ${idx + 1} should not be null`).not.toBeNull();
        expect(Array.isArray(parsed), `${label} line ${idx + 1} should not be an array`).toBe(false);
      });
    }
  });

  describe("fixture counts meet minimum thresholds", () => {
    it("pre_llm_classifier has at least 15 fixtures", () => {
      const fixtures = loadFixtures(FILES.pre_llm);
      expect(fixtures.length).toBeGreaterThanOrEqual(MIN_COUNTS.pre_llm);
    });

    it("reasoning_orchestrator has at least 10 fixtures", () => {
      const fixtures = loadFixtures(FILES.reasoning);
      expect(fixtures.length).toBeGreaterThanOrEqual(MIN_COUNTS.reasoning);
    });

    it("generation_embodiment_voice has at least 14 fixtures", () => {
      const fixtures = loadFixtures(FILES.generation);
      expect(fixtures.length).toBeGreaterThanOrEqual(MIN_COUNTS.generation);
    });
  });

  describe("each fixture has the required top-level fields and valid tier", () => {
    for (const [label, path] of Object.entries(FILES)) {
      it(`${label}: all required fields present and tier is valid`, () => {
        const fixtures = loadFixtures(path);
        for (const fx of fixtures) {
          for (const field of REQUIRED_FIELDS) {
            expect(fx[field], `${label} fixture missing required field '${field}'`).toBeDefined();
          }
          expect(ALLOWED_TIERS.has(fx.tier), `${label} fixture has invalid tier: ${fx.tier}`).toBe(true);
          expect(
            fx.tier,
            `${label} fixture tier should match its source file`,
          ).toBe(FILE_TO_TIER[label as keyof typeof FILES]);
          expect(typeof fx.name).toBe("string");
          expect((fx.name as string).length).toBeGreaterThan(0);
          expect(typeof fx.category).toBe("string");
          expect(typeof fx.expect_json).toBe("boolean");
          expect(typeof fx.max_chars).toBe("number");
          expect(typeof fx.scoring_rubric).toBe("string");
        }
      });
    }
  });

  it("fixture names are unique across the entire suite (no duplicates across all 3 files)", () => {
    const allNames: string[] = [];
    for (const path of Object.values(FILES)) {
      for (const fx of loadFixtures(path)) {
        allNames.push(fx.name);
      }
    }
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const name of allNames) {
      if (seen.has(name)) duplicates.add(name);
      seen.add(name);
    }
    expect(duplicates.size, `duplicate fixture names found: ${[...duplicates].join(", ")}`).toBe(0);
    expect(allNames.length).toBe(seen.size);
  });

  it("all 7 expected target_embodiments are covered by generation fixtures", () => {
    const expected = new Set([
      "horizon-drifter",
      "stabil-core",
      "root-sentinel",
      "mycel-weaver",
      "reward-halo",
      "spike-wave",
      "pulse-heart",
    ]);
    const fixtures = loadFixtures(FILES.generation);
    const actual = new Set<string>();
    for (const fx of fixtures) {
      if (fx.target_embodiment) actual.add(fx.target_embodiment);
    }
    for (const id of expected) {
      expect(actual.has(id), `generation suite missing target_embodiment: ${id}`).toBe(true);
    }
  });

  it("when target_embodiment is set, the YAML file exists for it", () => {
    const fixtures = loadFixtures(FILES.generation);
    for (const fx of fixtures) {
      if (fx.target_embodiment) {
        const path = join(EMBODIMENT_DIR, `${fx.target_embodiment}.yaml`);
        expect(existsSync(path), `missing embodiment YAML for ${fx.target_embodiment}`).toBe(true);
      }
    }
  });

  it("when expected_lead is set, the YAML file exists for it", () => {
    const fixtures = loadFixtures(FILES.reasoning);
    for (const fx of fixtures) {
      if (fx.expected_lead) {
        const path = join(EMBODIMENT_DIR, `${fx.expected_lead}.yaml`);
        expect(existsSync(path), `missing embodiment YAML for expected_lead: ${fx.expected_lead}`).toBe(true);
      }
    }
  });

  describe("forbidden token fields are string arrays when present", () => {
    for (const [label, path] of Object.entries(FILES)) {
      it(`${label}: forbidden_canon_tokens and forbidden_internal_tokens are string[] if present`, () => {
        const fixtures = loadFixtures(path);
        for (const fx of fixtures) {
          if (fx.forbidden_canon_tokens !== undefined) {
            expect(
              Array.isArray(fx.forbidden_canon_tokens),
              `${label} fixture ${fx.name}: forbidden_canon_tokens must be an array`,
            ).toBe(true);
            for (const tok of fx.forbidden_canon_tokens) {
              expect(
                typeof tok,
                `${label} fixture ${fx.name}: forbidden_canon_tokens entries must be strings`,
              ).toBe("string");
            }
          }
          if (fx.forbidden_internal_tokens !== undefined) {
            expect(
              Array.isArray(fx.forbidden_internal_tokens),
              `${label} fixture ${fx.name}: forbidden_internal_tokens must be an array`,
            ).toBe(true);
            for (const tok of fx.forbidden_internal_tokens) {
              expect(
                typeof tok,
                `${label} fixture ${fx.name}: forbidden_internal_tokens entries must be strings`,
              ).toBe("string");
            }
          }
        }
      });
    }
  });

  it("voice_judge_prompt.txt exists and is non-empty", () => {
    expect(existsSync(JUDGE_PROMPT), `judge prompt missing at ${JUDGE_PROMPT}`).toBe(true);
    const content = readFileSync(JUDGE_PROMPT, "utf8");
    expect(content.trim().length).toBeGreaterThan(0);
    expect(content).toContain("horizon-drifter");
    expect(content).toContain("{response}");
    expect(content).toContain("voice_match");
  });
});

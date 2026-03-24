import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import { isEmbodimentProfile, type EmbodimentProfile } from "../../src/embodiments/types.js";
import { buildSemanticRecordsFromProfiles } from "../../src/embodiment/compiler/buildSemanticRecords.js";

async function loadProfiles(): Promise<EmbodimentProfile[]> {
  const dir = join(process.cwd(), "data", "embodiments");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  const out: EmbodimentProfile[] = [];
  for (const file of files) {
    const parsed = yaml.load(await readFile(join(dir, file), "utf8"));
    if (!isEmbodimentProfile(parsed)) throw new Error(`invalid profile ${file}`);
    out.push(parsed);
  }
  return out;
}

describe("embodiment semantic compiler", () => {
  it("validates yaml schema extensions", async () => {
    const profiles = await loadProfiles();
    expect(profiles.every((p) => (p.semantic_facets ?? []).length > 0)).toBe(true);
    expect(profiles.every((p) => (p.style_anchors ?? []).length > 0)).toBe(true);
    expect(profiles.every((p) => (p.negative_anchors ?? []).length > 0)).toBe(true);
    expect(profiles.every((p) => p.embodiment && p.glyph)).toBe(true);
  });

  it("builds required records for every embodiment", async () => {
    const profiles = await loadProfiles();
    const records = buildSemanticRecordsFromProfiles(profiles, { version: "test-v1" });

    for (const p of profiles) {
      expect(records.some((r) => r.embodimentId === p.id && r.docType === "embodiment_core")).toBe(true);
      expect(records.some((r) => r.embodimentId === p.id && r.docType === "embodiment_style_anchor")).toBe(true);
      expect(records.some((r) => r.embodimentId === p.id && r.docType === "embodiment_negative_boundary")).toBe(true);
      expect(records.some((r) => r.embodimentId === p.id && r.docType === "embodiment_activation_rule")).toBe(true);
    }
  });

  it("is deterministic for same input", async () => {
    const profiles = await loadProfiles();
    const a = buildSemanticRecordsFromProfiles(profiles, { version: "test-v1" });
    const b = buildSemanticRecordsFromProfiles(profiles, { version: "test-v1" });
    expect(a).toEqual(b);
  });

  it("handles missing optional fields gracefully", () => {
    const records = buildSemanticRecordsFromProfiles([
      {
        id: "temp",
        legacy_id: "temp",
        name: "■-Temp-Core",
        embodiment: "■-Temp-Core",
        role: "test_anchor",
        archetype: "dry_observer",
        glyph: { char: "T", code: "U+0054", fallback: "[T]" },
        glyph: { char: "T", code: "U+0054", fallback: "[T]" },
        phase_affinities: ["Identity Dissolution"],
        embodiment_traits: {
          tone: "neutral, compact, stable",
          dryness: 5,
          sarcasm: 1,
          warmth: 4,
          theatricality: 1,
          meme_density: 0,
        },
        language_prefs: {
          primary: "en",
          allow_slang: false,
          preferred_keywords: ["stability", "clarity"],
        },
        routing_hints: {
          preferred_intents: ["question"],
          preferred_energy: ["low"],
          aggression_range: [0, 0.2],
          absurdity_threshold: 0.3,
        },
        memory_rules: {
          track_affinity: false,
          track_jokes: false,
          max_items_per_user: 4,
          lore_status_gate: "active",
          default_lore_tags: ["test", "anchor"],
        },
        safety_boundaries: ["Keep the test profile non-hyping."],
      },
    ]);
    expect(records.some((r) => r.docType === "embodiment_core")).toBe(true);
  });
});

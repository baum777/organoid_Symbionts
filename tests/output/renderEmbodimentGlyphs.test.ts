import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerEmbodiment } from "../../src/embodiments/registry.js";
import { EMBODIMENT_GLYPH_MARKER, deriveActivatedEmbodiments, renderEmbodimentGlyphs } from "../../src/output/renderEmbodimentGlyphs.js";
import type { EmbodimentProfile } from "../../src/embodiments/types.js";

function embodiment(id: string, char: string, fallback = "[F]"): EmbodimentProfile {
  return {
    id,
    name: id,
    role: "role",
    archetype: "dry_observer",
    embodiment: `${char}-Embodiment`,
    glyph: { char, code: "x", fallback },
    phase_affinities: ["Identity Dissolution"],
    embodiment_traits: {
      tone: "grounded",
      sarcasm: 5,
      meme_density: 1,
      warmth: 3,
      theatricality: 2,
      dryness: 8,
    },
    language_prefs: {
      primary: "en",
      allow_slang: true,
      preferred_keywords: ["signal"],
    },
    routing_hints: {
      preferred_intents: ["conversation"],
      preferred_energy: ["mid"],
      aggression_range: [0, 1],
      absurdity_threshold: 0.5,
    },
    memory_rules: {
      track_affinity: true,
      track_jokes: true,
      max_items_per_user: 12,
      lore_status_gate: "active",
      default_lore_tags: [id],
    },
    safety_boundaries: ["Never imply buy/sell advice."],
    semantic_facets: [],
    style_anchors: [],
    negative_anchors: [],
    canonical_examples: [],
  };
}

describe("renderEmbodimentGlyphs", () => {
  beforeEach(() => {
    clearRegistry();
    registerEmbodiment(embodiment("stillhalter", "■", "[STILL]"));
    registerEmbodiment(embodiment("nebelspieler", "◇", "[NEBEL]"));
    registerEmbodiment(embodiment("glutkern", "◆", "[GLUT]"));
    registerEmbodiment(embodiment("muenzhueter", "", "[MUENZ]"));
  });

  it("wraps start and end with the same glyph when one embodiment is active", () => {
    const out = renderEmbodimentGlyphs("hello", { primary: "stillhalter" });
    expect(out.startsWith("■ ")).toBe(true);
    expect(out.includes(" hello ■")).toBe(true);
    expect(out.includes(EMBODIMENT_GLYPH_MARKER)).toBe(true);
  });

  it("renders secondary glyph output when a second embodiment is active", () => {
    const out = renderEmbodimentGlyphs("hello", { primary: "stillhalter", secondary: "nebelspieler" });
    expect(out.startsWith("■ ")).toBe(true);
    expect(out.includes(" hello ◇")).toBe(true);
  });

  it("adds a middle glyph paragraph when three embodiments are active", () => {
    const out = renderEmbodimentGlyphs("hello", { primary: "stillhalter", secondary: "nebelspieler", tertiary: "glutkern" });
    expect(out).toContain("\n\n◇\n\n");
  });

  it("falls back for unknown or missing unicode glyph", () => {
    expect(renderEmbodimentGlyphs("hello", { primary: "unknown" })).toContain("[ORGANOID]");
    expect(renderEmbodimentGlyphs("hello", { primary: "muenzhueter" })).toContain("[MUENZ]");
  });

  it("deduplicates and limits to three embodiments", () => {
    const embodiments = deriveActivatedEmbodiments("stillhalter", ["stillhalter", "nebelspieler", "glutkern", "muenzhueter"]);
    expect(embodiments).toEqual({ primary: "stillhalter", secondary: "nebelspieler", tertiary: "glutkern" });
  });

  it("guards empty response and idempotency marker", () => {
    expect(renderEmbodimentGlyphs("  ", { primary: "stillhalter" })).toBe("");
    const once = renderEmbodimentGlyphs("hello", { primary: "stillhalter" });
    const twice = renderEmbodimentGlyphs(once, { primary: "stillhalter" });
    expect(twice).toBe(once.trim());
  });
});

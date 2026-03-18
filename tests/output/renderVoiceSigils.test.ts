import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerGnome } from "../../src/gnomes/registry.js";
import {
  deriveActivatedEmbodiments,
  deriveActivatedVoices,
  renderVoiceGlyphs,
  renderVoiceSigils,
  VOICE_GLYPH_MARKER,
} from "../../src/output/renderVoiceSigils.js";

function gnome(id: string, char: string, fallback = "[F]") {
  return {
    id,
    legacy_id: id,
    name: id,
    embodiment: `${char}-Embodiment`,
    role: "role",
    archetype: "dry_observer" as const,
    sigil: { char, code: "x", fallback },
    glyph: { char, code: "x", fallback },
  };
}

describe("renderVoiceSigils", () => {
  beforeEach(() => {
    clearRegistry();
    registerGnome(gnome("stillhalter", "■", "[STILL]"));
    registerGnome(gnome("nebelspieler", "◇", "[NEBEL]"));
    registerGnome(gnome("glutkern", "◆", "[GLUT]"));
    registerGnome(gnome("muenzhueter", "", "[MUENZ]"));
  });

  it("1 voice wraps start and end with same glyph", () => {
    const out = renderVoiceGlyphs("hello", { primary: "stillhalter" });
    expect(out.startsWith("■ ")).toBe(true);
    expect(out.includes(" hello ■")).toBe(true);
  });

  it("legacy alias still renders glyph output", () => {
    const out = renderVoiceSigils("hello", { primary: "stillhalter", secondary: "nebelspieler" });
    expect(out.startsWith("■ ")).toBe(true);
    expect(out.includes(" hello ◇")).toBe(true);
  });

  it("3 voices add middle glyph paragraph and glyph marker", () => {
    const out = renderVoiceGlyphs("hello", { primary: "stillhalter", secondary: "nebelspieler", tertiary: "glutkern" });
    expect(out).toContain("\n\n◇\n\n");
    expect(out.includes(VOICE_GLYPH_MARKER)).toBe(true);
  });

  it("falls back for unknown or missing unicode glyph", () => {
    expect(renderVoiceGlyphs("hello", { primary: "unknown" })).toContain("[GNOME]");
    expect(renderVoiceGlyphs("hello", { primary: "muenzhueter" })).toContain("[MUENZ]");
  });

  it("deduplicates and limits to 3 voices/embodiments", () => {
    const voices = deriveActivatedVoices("stillhalter", ["stillhalter", "nebelspieler", "glutkern", "muenzhueter"]);
    const embodiments = deriveActivatedEmbodiments("stillhalter", ["stillhalter", "nebelspieler", "glutkern", "muenzhueter"]);
    expect(voices).toEqual({ primary: "stillhalter", secondary: "nebelspieler", tertiary: "glutkern" });
    expect(embodiments).toEqual(voices);
  });

  it("guards empty response and idempotency marker", () => {
    expect(renderVoiceGlyphs("  ", { primary: "stillhalter" })).toBe("");
    const once = renderVoiceGlyphs("hello", { primary: "stillhalter" });
    const twice = renderVoiceGlyphs(once, { primary: "stillhalter" });
    expect(twice).toBe(once);
  });
});

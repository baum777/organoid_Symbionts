import { EMBODIMENT_GLYPH_MARKER } from "../../src/output/renderEmbodimentGlyphs.js";

export function stripEmbodimentGlyphs(text: string): string {
  return text
    .replace(new RegExp(`\\n\\n${EMBODIMENT_GLYPH_MARKER}\\n`, "g"), "")
    .replace(/^\S+\s+/, "")
    .replace(/\s+\S+$/s, "")
    .trim();
}

export function hasEmbodimentGlyphMarker(text: string): boolean {
  return text.includes(EMBODIMENT_GLYPH_MARKER);
}

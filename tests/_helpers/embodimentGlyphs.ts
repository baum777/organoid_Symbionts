import { EMBODIMENT_GLYPH_MARKER } from "../../src/output/renderEmbodimentGlyphs.js";

export function stripEmbodimentGlyphs(text: string): string {
  const withoutMarker = text.replace(new RegExp(`\\n?\\n?${EMBODIMENT_GLYPH_MARKER}\\n?`, "g"), "");
  const withoutStandaloneGlyphLines = withoutMarker
    .split(/\n+/)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && trimmed !== EMBODIMENT_GLYPH_MARKER && !/^[\p{S}\p{P}]+$/u.test(trimmed);
    })
    .join(" ");

  return withoutStandaloneGlyphLines
    .replace(/\s+[\p{S}\p{P}]+$/u, "")
    .replace(/^[\p{S}\p{P}]+\s+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasEmbodimentGlyphMarker(text: string): boolean {
  return text.includes(EMBODIMENT_GLYPH_MARKER);
}

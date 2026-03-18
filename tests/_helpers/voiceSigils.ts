import { LEGACY_VOICE_SIGIL_MARKER, VOICE_GLYPH_MARKER } from "../../src/output/renderVoiceSigils.js";

export function stripVoiceSigils(text: string): string {
  return text
    .replace(new RegExp(`\n\n(?:${VOICE_GLYPH_MARKER}|${LEGACY_VOICE_SIGIL_MARKER})\n`, "g"), "")
    .replace(/^\S+\s+/, "")
    .replace(/\s+\S+$/s, "")
    .trim();
}

export function hasVoiceSigilMarker(text: string): boolean {
  return text.includes(VOICE_GLYPH_MARKER) || text.includes(LEGACY_VOICE_SIGIL_MARKER);
}

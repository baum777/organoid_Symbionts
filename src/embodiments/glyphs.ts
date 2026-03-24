import { getEmbodiment } from "./registry.js";
import type { EmbodimentGlyph, EmbodimentProfile } from "./types.js";

const GLOBAL_FALLBACK_GLYPH = "[ORGANOID]";

function isUsableChar(char: string | undefined): char is string {
  return typeof char === "string" && char.trim().length > 0;
}

function resolveProfile(profileOrId: EmbodimentProfile | string | undefined): EmbodimentProfile | undefined {
  if (typeof profileOrId === "string") {
    return getEmbodiment(profileOrId);
  }
  return profileOrId;
}

export function resolveGlyph(profileOrId: EmbodimentProfile | string | undefined): EmbodimentGlyph {
  const profile = resolveProfile(profileOrId);
  const glyph = profile?.glyph;
  const fallback = glyph?.fallback?.trim() || GLOBAL_FALLBACK_GLYPH;

  return {
    char: isUsableChar(glyph?.char) ? glyph.char.trim() : fallback,
    code: glyph?.code?.trim() || "fallback",
    fallback,
  };
}

export function getGlyphForEmbodiment(id: string): string {
  return resolveGlyph(id).char;
}

export function getFallbackGlyph(id: string): string {
  return resolveGlyph(id).fallback;
}

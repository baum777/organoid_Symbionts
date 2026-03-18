import { getGnome } from "./registry.js";
import { getProfileGlyph, type GnomeProfile, type GnomeSigil } from "./types.js";

const GLOBAL_FALLBACK_SIGIL = "[GNOME]";

function isUsableChar(char: string | undefined): char is string {
  return typeof char === "string" && char.trim().length > 0;
}

export function resolveSigil(profileOrId: GnomeProfile | string | undefined): GnomeSigil {
  const profile = typeof profileOrId === "string" ? getGnome(profileOrId) : profileOrId;
  const glyph = profile ? getProfileGlyph(profile) : undefined;
  const fallback = glyph?.fallback?.trim() || profile?.sigil?.fallback?.trim() || GLOBAL_FALLBACK_SIGIL;
  return {
    char: isUsableChar(glyph?.char) ? glyph.char.trim() : fallback,
    code: glyph?.code?.trim() || profile?.sigil?.code?.trim() || "fallback",
    fallback,
  };
}

export const resolveGlyph = resolveSigil;

export function getSigilForGnome(id: string): string {
  return resolveSigil(id).char;
}

export function getGlyphForGnome(id: string): string {
  return resolveGlyph(id).char;
}

export function getFallbackSigil(id: string): string {
  return resolveSigil(id).fallback;
}

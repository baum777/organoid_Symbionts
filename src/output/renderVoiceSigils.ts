/**
 * TODO(ORGANOID-MIGRATION): visible output still exposes the legacy sigil file path.
 * REPLACE-WITH-ORGANOID: Wave 2 adds glyph-first aliases while preserving the import path for runtime safety.
 */

import { getGlyphForGnome } from "../gnomes/sigils.js";
import { trimToLimit } from "../utils/textTrim.js";

/**
 * Legacy output naming remains for compatibility. New code should prefer the embodiment/glyph
 * aliases exported from this module.
 */
export type ActivatedVoiceSet = {
  primary: string;
  secondary?: string;
  tertiary?: string;
};

export type ActivatedEmbodimentSet = ActivatedVoiceSet;

<<<<<<< ours
<<<<<<< ours
export const VOICE_GLYPH_MARKER = "--voice-glyphs--";
export const LEGACY_VOICE_SIGIL_MARKER = "--voice-sigils--";

=======
>>>>>>> theirs
=======
>>>>>>> theirs
function normalizeVoices(voices: ActivatedVoiceSet): string[] {
  return [voices.primary, voices.secondary, voices.tertiary]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().toLowerCase())
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 3);
}

function alreadyGlyphized(text: string): boolean {
  return text.includes(VOICE_GLYPH_MARKER) || text.includes(LEGACY_VOICE_SIGIL_MARKER);
}

export function renderVoiceGlyphs(text: string, voices: ActivatedEmbodimentSet): string {
  if (alreadyGlyphized(text)) return text;
  const clean = text.trim();
  if (!clean) return "";

  const active = normalizeVoices(voices);
  if (active.length === 0) return clean;

  const [v1, v2, v3] = active;
  if (!v1) return clean;
  const g1 = getGlyphForGnome(v1);
  const g2 = v2 ? getGlyphForGnome(v2) : g1;
  const g3 = v3 ? getGlyphForGnome(v3) : g2;

  const marker = `

${VOICE_GLYPH_MARKER}
`;

  if (!v2) return `${g1} ${clean} ${g1}${marker}`;
  if (!v3) return `${g1} ${clean} ${g2}${marker}`;
  return `${g1} ${clean}

${g2}

${g3}${marker}`;
}

<<<<<<< ours
export function renderVoiceSigils(text: string, voices: ActivatedVoiceSet): string {
  return renderVoiceGlyphs(text, voices);
}

export function deriveActivatedEmbodiments(selectedGnomeId: string, cameoCandidates?: string[]): ActivatedEmbodimentSet {
=======
export function renderEmbodimentGlyphs(text: string, embodiments: ActivatedEmbodimentSet): string {
  return renderVoiceSigils(text, embodiments);
}

export function renderEmbodimentGlyphs(text: string, embodiments: ActivatedEmbodimentSet): string {
  return renderVoiceSigils(text, embodiments);
}

export function deriveActivatedVoices(selectedGnomeId: string, cameoCandidates?: string[]): ActivatedVoiceSet {
>>>>>>> theirs
  const voices = [selectedGnomeId, ...(cameoCandidates ?? [])]
    .filter(Boolean)
    .map((v) => v.toLowerCase())
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 3);

  return {
    primary: voices[0] ?? selectedGnomeId,
    secondary: voices[1],
    tertiary: voices[2],
  };
}

<<<<<<< ours
<<<<<<< ours
export function deriveActivatedVoices(selectedGnomeId: string, cameoCandidates?: string[]): ActivatedVoiceSet {
  return deriveActivatedEmbodiments(selectedGnomeId, cameoCandidates);
}

export function trimGlyphDecoratedReply(text: string, limit: number): string {
  return trimToLimit(text, limit);
}
=======
=======
>>>>>>> theirs
export function deriveActivatedEmbodiments(
  selectedEmbodimentId: string,
  coActivatedEmbodiments?: string[],
): ActivatedEmbodimentSet {
  return deriveActivatedVoices(selectedEmbodimentId, coActivatedEmbodiments);
}

export { trimToLimit };
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs

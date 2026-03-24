import { getSigilForGnome } from "../gnomes/sigils.js";
import { observePulseHeart } from "../observability/pulseHeart.js";
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

function normalizeVoices(voices: ActivatedVoiceSet): string[] {
  return [voices.primary, voices.secondary, voices.tertiary]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim().toLowerCase())
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 3);
}

function alreadySigilized(text: string): boolean {
  return text.includes("--voice-sigils--");
}

export function renderVoiceSigils(text: string, voices: ActivatedVoiceSet): string {
  if (alreadySigilized(text)) return text;
  const clean = text.trim();
  if (!clean) return "";

  const active = normalizeVoices(voices);
  if (active.length === 0) return clean;

  observePulseHeart({
    surface: "render",
    label: "voice-sigils",
    text: clean,
    activeOrganoidIds: active,
    advancePhase: false,
    persist: false,
  });

  const [v1, v2, v3] = active;
  if (!v1) return clean;
  const s1 = getSigilForGnome(v1);
  const s2 = v2 ? getSigilForGnome(v2) : s1;
  const s3 = v3 ? getSigilForGnome(v3) : s2;

  const marker = "\n\n--voice-sigils--\n";

  if (!v2) return `${s1} ${clean} ${s1}${marker}`;
  if (!v3) return `${s1} ${clean} ${s2}${marker}`;
  return `${s1} ${clean}\n\n${s2}\n\n${s3}${marker}`;
}

export function renderEmbodimentGlyphs(text: string, embodiments: ActivatedEmbodimentSet): string {
  return renderVoiceSigils(text, embodiments);
}

export function deriveActivatedVoices(selectedGnomeId: string, cameoCandidates?: string[]): ActivatedVoiceSet {
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

export function deriveActivatedEmbodiments(
  selectedEmbodimentId: string,
  coActivatedEmbodiments?: string[],
): ActivatedEmbodimentSet {
  return deriveActivatedVoices(selectedEmbodimentId, coActivatedEmbodiments);
}

export { trimToLimit };

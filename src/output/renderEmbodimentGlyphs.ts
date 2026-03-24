import { getGlyphForEmbodiment } from "../embodiments/glyphs.js";
import { observePulseHeart } from "../observability/pulseHeart.js";
import { trimToLimit } from "../utils/textTrim.js";

export const EMBODIMENT_GLYPH_MARKER = "[ORGANOID]";

export type ActivatedEmbodimentSet = {
  primary: string;
  secondary?: string;
  tertiary?: string;
};

function normalizeEmbodiments(embodiments: ActivatedEmbodimentSet): string[] {
  return [embodiments.primary, embodiments.secondary, embodiments.tertiary]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase())
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);
}

function alreadyGlyphized(text: string): boolean {
  return text.includes(EMBODIMENT_GLYPH_MARKER);
}

export function renderEmbodimentGlyphs(text: string, embodiments: ActivatedEmbodimentSet): string {
  const clean = text.trim();
  if (!clean) return "";
  if (alreadyGlyphized(clean)) return clean;

  const active = normalizeEmbodiments(embodiments);
  if (active.length === 0) return clean;

  observePulseHeart({
    surface: "render",
    label: "embodiment-glyphs",
    text: clean,
    activeOrganoidIds: active,
    advancePhase: false,
    persist: false,
  });

  const primary = active[0];
  if (!primary) return clean;
  const secondary = active[1];
  const tertiary = active[2];
  const g1 = getGlyphForEmbodiment(primary);
  const g2 = secondary ? getGlyphForEmbodiment(secondary) : g1;
  const g3 = tertiary ? getGlyphForEmbodiment(tertiary) : g2;
  const marker = `\n\n${EMBODIMENT_GLYPH_MARKER}\n`;

  if (!secondary) return `${g1} ${clean} ${g1}${marker}`;
  if (!tertiary) return `${g1} ${clean} ${g2}${marker}`;
  return `${g1} ${clean}\n\n${g2}\n\n${g3}${marker}`;
}

export function deriveActivatedEmbodiments(selectedEmbodimentId: string, cameoCandidates?: string[]): ActivatedEmbodimentSet {
  const embodiments = [selectedEmbodimentId, ...(cameoCandidates ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);

  return {
    primary: embodiments[0] ?? selectedEmbodimentId,
    secondary: embodiments[1],
    tertiary: embodiments[2],
  };
}

export { trimToLimit };

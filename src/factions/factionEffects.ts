/**
 * Faction Effects — Apply faction flavor to prompts
 *
 * Phase-5: Phrase choice, tone overlays.
 */

import { getFactionForEmbodiment } from "./factionRegistry.js";

export interface FactionEffect {
  embodimentId: string;
  factionMotif?: string;
  toneHint?: string;
}

export function getFactionEffects(embodimentId: string): FactionEffect {
  const faction = getFactionForEmbodiment(embodimentId);
  return {
    embodimentId,
    factionMotif: faction?.description,
    toneHint: faction ? `${faction.name} energy` : undefined,
  };
}

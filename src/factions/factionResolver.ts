/**
 * Faction Resolver — Resolve embodiment faction context for routing
 *
 * Phase-5: Influences tone, cameo patterns.
 */

import { getFactionForEmbodiment } from "./factionRegistry.js";

export interface FactionContext {
  embodimentId: string;
  factionId: string | null;
  factionName: string | null;
}

export function resolveFactionContext(embodimentId: string): FactionContext {
  const faction = getFactionForEmbodiment(embodimentId);
  return {
    embodimentId,
    factionId: faction?.id ?? null,
    factionName: faction?.name ?? null,
  };
}

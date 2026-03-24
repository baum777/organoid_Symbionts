/**
 * Feature Gates — Operator control for organoid embodiment features.
 *
 * Phase-5: Enable/disable world events, lore expansion, and safe mode.
 */

export interface FeatureGates {
  worldEventsEnabled: boolean;
  loreExpansionEnabled: boolean;
  safeMode: boolean;
}

export function getFeatureGates(): FeatureGates {
  return {
    worldEventsEnabled: process.env.EMBODIMENT_WORLD_EVENTS_ENABLED === "true",
    loreExpansionEnabled: process.env.EMBODIMENT_LORE_EXPANSION_ENABLED === "true",
    safeMode: process.env.EMBODIMENT_SAFE_MODE === "true",
  };
}

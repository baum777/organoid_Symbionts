/**
 * Faction Registry — Embodiment worldview clusters
 *
 * Phase-5: Ash Circle, Neon Burrow, Root Ledger, Moss Court, Thorn Watch.
 */

export interface Faction {
  id: string;
  name: string;
  description: string;
  embodimentIds: string[];
}

const FACTIONS: Faction[] = [
  { id: "ash_circle", name: "Ash Circle", description: "Funeral, memory, collapse", embodimentIds: ["organoid"] },
  { id: "neon_burrow", name: "Neon Burrow", description: "Meme chaos, velocity", embodimentIds: ["spark"] },
  { id: "moss_court", name: "Moss Court", description: "Dry witnesses, detached irony", embodimentIds: ["moss"] },
];

export function getAllFactions(): Faction[] {
  return [...FACTIONS];
}

export function getFactionForEmbodiment(embodimentId: string): Faction | null {
  return FACTIONS.find((f) => f.embodimentIds.includes(embodimentId)) ?? null;
}

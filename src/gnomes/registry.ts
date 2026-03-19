/**
 * Gnome Registry — legacy compatibility registry for identity profiles.
 *
 * TODO(ORGANOID-MIGRATION): Replace remaining gnome-specific naming after downstream imports
 * have switched to the embodiment-compatible aliases exported here.
 */

import type { GnomeProfile, OrganoidEmbodimentProfile } from "./types.js";

/** In-memory registry of legacy gnome profiles by id. */
const registry = new Map<string, GnomeProfile>();

/** Register a gnome profile. Overwrites if id exists. */
export function registerGnome(profile: GnomeProfile): void {
  registry.set(profile.id.toLowerCase(), profile);
}

/** Register an embodiment profile through the compatibility alias. */
export function registerEmbodiment(profile: OrganoidEmbodimentProfile): void {
  registerGnome(profile);
}

/** Get gnome by id. Returns undefined if not found. */
export function getGnome(id: string): GnomeProfile | undefined {
  return registry.get(id.toLowerCase());
}

/** Get embodiment by id through the compatibility alias. */
export function getEmbodiment(id: string): OrganoidEmbodimentProfile | undefined {
  return getGnome(id);
}

/** Get all registered gnomes. */
export function getAllGnomes(): GnomeProfile[] {
  return Array.from(registry.values());
}

/** Get all registered embodiments through the compatibility alias. */
export function getAllEmbodiments(): OrganoidEmbodimentProfile[] {
  return getAllGnomes();
}

/** Get fallback chain of defensive voices. */
export function getFallbackChain(): string[] {
  const order = ["stillhalter", "wurzelwaechter", "muenzhueter"] as const;
  const dynamic = order.filter((id) => registry.has(id));
  if (dynamic.length > 0) return dynamic;
  return Array.from(registry.keys()).sort();
}

/** Get fallback chain via Organoid compatibility naming. */
export function getEmbodimentFallbackChain(): string[] {
  return getFallbackChain();
}

/** Clear registry (for tests). */
export function clearRegistry(): void {
  registry.clear();
}

/** Clear registry via Organoid compatibility naming. */
export function clearEmbodimentRegistry(): void {
  clearRegistry();
}

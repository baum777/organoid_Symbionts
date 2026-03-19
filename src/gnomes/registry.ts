/**
 * Gnome Registry — In-memory character registry
 *
 * Holds loaded gnome profiles. Use loadGnomes() to populate from data/gnomes/*.yaml
 */

import {
  getLegacyProfileId,
  getProfileEmbodiment,
  isOrganoidEmbodimentProfile,
  type GnomeProfile,
  type OrganoidEmbodimentProfile,
} from "./types.js";

/** In-memory registry of gnome profiles by id */
const registry = new Map<string, GnomeProfile>();
const organoidRegistry = new Map<string, OrganoidEmbodimentProfile>();
const embodimentToLegacyId = new Map<string, string>();

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Register a gnome profile. Overwrites if id exists.
 */
export function registerGnome(profile: GnomeProfile): void {
  const legacyId = normalizeKey(getLegacyProfileId(profile));
  const runtimeId = normalizeKey(profile.id);
  const embodimentKey = normalizeKey(getProfileEmbodiment(profile));

  registry.set(runtimeId, profile);
  registry.set(legacyId, profile);
  registry.set(embodimentKey, profile);

  embodimentToLegacyId.set(embodimentKey, runtimeId);

  if (isOrganoidEmbodimentProfile(profile)) {
    organoidRegistry.set(runtimeId, profile);
    organoidRegistry.set(legacyId, profile);
    organoidRegistry.set(embodimentKey, profile);
  }
}

/**
 * Get gnome by id. Returns undefined if not found.
 */
export function getGnome(id: string): GnomeProfile | undefined {
  return registry.get(normalizeKey(id));
}

/** Get organoid embodiment profile by legacy id or embodiment label. */
export function getOrganoidProfile(idOrEmbodiment: string): OrganoidEmbodimentProfile | undefined {
  return organoidRegistry.get(normalizeKey(idOrEmbodiment));
}

/** Resolve embodiment label to the current legacy/runtime id. */
export function getLegacyIdForEmbodiment(embodiment: string): string | undefined {
  return embodimentToLegacyId.get(normalizeKey(embodiment));
}

/**
 * Get all registered gnomes.
 */
export function getAllGnomes(): GnomeProfile[] {
  return Array.from(new Map(Array.from(registry.values()).map((profile) => [profile.id, profile])).values());
}

/** Get all registered organoid embodiment profiles. */
export function getAllOrganoidProfiles(): OrganoidEmbodimentProfile[] {
  return Array.from(new Map(Array.from(organoidRegistry.values()).map((profile) => [profile.id, profile])).values());
}

/**
 * Get fallback chain of defensive voices.
 */
export function getFallbackChain(): string[] {
  const order = ["stillhalter", "wurzelwaechter", "muenzhueter"] as const;
  const dynamic = order.filter((id) => registry.has(id));
  if (dynamic.length > 0) return dynamic;
  return getAllGnomes().map((profile) => profile.id).sort();
}

/**
 * Clear registry (for tests).
 */
export function clearRegistry(): void {
  registry.clear();
  organoidRegistry.clear();
  embodimentToLegacyId.clear();
}

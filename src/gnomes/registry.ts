/**
 * Gnome Registry — legacy compatibility registry for identity profiles.
 *
 * TODO(ORGANOID-MIGRATION): Replace remaining gnome-specific naming after downstream imports
 * have switched to the embodiment-compatible aliases exported here.
 */

<<<<<<< ours
<<<<<<< ours
import {
  getLegacyProfileId,
  getProfileEmbodiment,
  isOrganoidEmbodimentProfile,
  type GnomeProfile,
  type OrganoidEmbodimentProfile,
} from "./types.js";
=======
import type { GnomeProfile, OrganoidEmbodimentProfile } from "./types.js";
>>>>>>> theirs
=======
import type { GnomeProfile, OrganoidEmbodimentProfile } from "./types.js";
>>>>>>> theirs

/** In-memory registry of legacy gnome profiles by id. */
const registry = new Map<string, GnomeProfile>();
const organoidRegistry = new Map<string, OrganoidEmbodimentProfile>();
const embodimentToLegacyId = new Map<string, string>();

<<<<<<< ours
function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

=======
>>>>>>> theirs
/** Register a gnome profile. Overwrites if id exists. */
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

/** Register an embodiment profile through the compatibility alias. */
export function registerEmbodiment(profile: OrganoidEmbodimentProfile): void {
  registerGnome(profile);
}

/** Get gnome by id. Returns undefined if not found. */
export function getGnome(id: string): GnomeProfile | undefined {
  return registry.get(normalizeKey(id));
}

<<<<<<< ours
/** Get organoid embodiment profile by legacy id or embodiment label. */
export function getOrganoidProfile(idOrEmbodiment: string): OrganoidEmbodimentProfile | undefined {
  return organoidRegistry.get(normalizeKey(idOrEmbodiment));
}

/** Resolve embodiment label to the current legacy/runtime id. */
export function getLegacyIdForEmbodiment(embodiment: string): string | undefined {
  return embodimentToLegacyId.get(normalizeKey(embodiment));
}

=======
>>>>>>> theirs
/** Get embodiment by id through the compatibility alias. */
export function getEmbodiment(id: string): OrganoidEmbodimentProfile | undefined {
  return getGnome(id);
}

/** Get all registered gnomes. */
export function getAllGnomes(): GnomeProfile[] {
  return Array.from(new Map(Array.from(registry.values()).map((profile) => [profile.id, profile])).values());
}

<<<<<<< ours
/** Get all registered organoid embodiment profiles. */
export function getAllOrganoidProfiles(): OrganoidEmbodimentProfile[] {
  return Array.from(new Map(Array.from(organoidRegistry.values()).map((profile) => [profile.id, profile])).values());
}

=======
>>>>>>> theirs
/** Get all registered embodiments through the compatibility alias. */
export function getAllEmbodiments(): OrganoidEmbodimentProfile[] {
  return getAllGnomes();
}

/** Get fallback chain of defensive voices. */
export function getFallbackChain(): string[] {
  const order = ["stillhalter", "wurzelwaechter", "muenzhueter"] as const;
  const dynamic = order.filter((id) => registry.has(id));
  if (dynamic.length > 0) return dynamic;
  return getAllGnomes().map((profile) => profile.id).sort();
}

/** Get fallback chain via Organoid compatibility naming. */
export function getEmbodimentFallbackChain(): string[] {
  return getFallbackChain();
}

/** Clear registry (for tests). */
export function clearRegistry(): void {
  registry.clear();
  organoidRegistry.clear();
  embodimentToLegacyId.clear();
}

/** Clear registry via Organoid compatibility naming. */
export function clearEmbodimentRegistry(): void {
  clearRegistry();
}

/** Clear registry via Organoid compatibility naming. */
export function clearEmbodimentRegistry(): void {
  clearRegistry();
}

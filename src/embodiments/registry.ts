/**
 * In-memory embodiment registry.
 */

import { getProfileEmbodiment, isOrganoidEmbodimentProfile, type EmbodimentProfile, type OrganoidEmbodimentProfile } from "./types.js";

const registry = new Map<string, EmbodimentProfile>();
const organoidRegistry = new Map<string, OrganoidEmbodimentProfile>();

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function setProfile(profile: EmbodimentProfile): void {
  const id = normalizeKey(profile.id);
  const embodiment = normalizeKey(getProfileEmbodiment(profile));
  const name = normalizeKey(profile.name);

  registry.set(id, profile);
  registry.set(embodiment, profile);
  registry.set(name, profile);

  if (isOrganoidEmbodimentProfile(profile)) {
    organoidRegistry.set(id, profile);
    organoidRegistry.set(embodiment, profile);
    organoidRegistry.set(name, profile);
  }
}

export function registerEmbodiment(profile: EmbodimentProfile): void {
  setProfile(profile);
}

export function getEmbodiment(id: string): EmbodimentProfile | undefined {
  return registry.get(normalizeKey(id));
}

export function getOrganoidProfile(idOrEmbodiment: string): OrganoidEmbodimentProfile | undefined {
  return organoidRegistry.get(normalizeKey(idOrEmbodiment));
}

export function getLegacyIdForEmbodiment(idOrEmbodiment: string): string | undefined {
  return getOrganoidProfile(idOrEmbodiment)?.id ?? getEmbodiment(idOrEmbodiment)?.id;
}

export function getAllEmbodiments(): EmbodimentProfile[] {
  return Array.from(new Map(Array.from(registry.values()).map((profile) => [profile.id, profile])).values());
}

export function getAllOrganoidProfiles(): OrganoidEmbodimentProfile[] {
  return Array.from(new Map(Array.from(organoidRegistry.values()).map((profile) => [profile.id, profile])).values());
}

export function getFallbackChain(): string[] {
  const order = ["stillhalter", "wurzelwaechter", "muenzhueter"] as const;
  const dynamic = order.filter((id) => registry.has(id));
  if (dynamic.length > 0) return dynamic;
  return getAllEmbodiments().map((profile) => profile.id).sort();
}

export function clearRegistry(): void {
  registry.clear();
  organoidRegistry.clear();
}

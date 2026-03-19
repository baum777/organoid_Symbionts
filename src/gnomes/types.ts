/**
 * TODO(ORGANOID-MIGRATION): `GnomeProfile`, `GnomeArchetype`, and `GnomeSigil` remain the runtime compatibility surface.
 * REPLACE-WITH-ORGANOID: Wave 2 introduces additive embodiment/glyph aliases so runtime code can migrate without a hard cut.
 */

/**
 * Gnome types — Character profile definitions for multi-voice ensemble.
 */

export type GnomeArchetype =
  | "chaos_roaster"
  | "dry_observer"
  | "chaotic_reactor"
  | "skeptical_builder"
  | "playful_teaser"
  | "ash_priest";

export type GnomeSigil = {
  char: string;
  code: string;
  fallback: string;
};

export type OrganoidGlyph = GnomeSigil;

export type OrganoidPhase =
  | "Identity Dissolution"
  | "Swarm Coherence"
  | "Sovereign Propagation"
  | "Ontological Restructuring"
  | "Eternal Flow Horizon";

export interface OrganoidEmbodimentDescriptor {
  /** Canonical embodiment label, e.g. `■-Stabil-Core`. */
  embodiment: string;
  /** Canonical glyph anchor. */
  glyph?: OrganoidGlyph;
  /** Compatibility alias back to the legacy runtime id. */
  legacy_id?: string;
  /** Optional phase affinities from the migration SSOT. */
  phase_affinities?: OrganoidPhase[];
}

export interface VoiceTraits {
  tone?: string;
  sarcasm?: number;
  meme_density?: number;
  warmth?: number;
  theatricality?: number;
  dryness?: number;
}

export interface LanguagePrefs {
  primary?: string;
  allow_slang?: boolean;
  preferred_keywords?: string[];
}

export interface RoutingHints {
  preferred_intents?: string[];
  preferred_energy?: string[];
  aggression_range?: [number, number];
  absurdity_threshold?: number;
}

export interface MemoryRules {
  track_affinity?: boolean;
  track_jokes?: boolean;
  max_items_per_user?: number;
  lore_status_gate?: string;
  default_lore_tags?: string[];
}

export interface RelationHints {
  complements?: string[];
  suppresses?: string[];
  escalates_with?: string[];
  stabilizes_with?: string[];
}

export interface GnomeProfile extends OrganoidEmbodimentDescriptor {
  id: string;
  name: string;
  role: string;
  archetype: GnomeArchetype;
  sigil: GnomeSigil;
  voice_traits?: VoiceTraits;
  language_prefs?: LanguagePrefs;
  routing_hints?: RoutingHints;
  memory_rules?: MemoryRules;
  persona_fragment?: string;
  safety_boundaries?: string[];
  semantic_facets?: string[];
  style_anchors?: string[];
  negative_anchors?: string[];
  relation_hints?: RelationHints;
  retrieval_priority?: number;
  canonical_examples?: string[];
}

export interface OrganoidEmbodimentProfile extends GnomeProfile {
  embodiment: string;
  glyph: OrganoidGlyph;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isOptionalStringArray(v: unknown): boolean {
  return v === undefined || isStringArray(v);
}

function isSigilLike(v: unknown): v is GnomeSigil {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.char === "string" && typeof obj.code === "string" && typeof obj.fallback === "string";
}

export function isGnomeProfile(v: unknown): v is GnomeProfile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const sigil = o.sigil;
  const glyph = o.glyph;
  const memoryRules = o.memory_rules as Record<string, unknown> | undefined;
  const relationHints = o.relation_hints as Record<string, unknown> | undefined;

  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.role === "string" &&
    typeof o.archetype === "string" &&
    isSigilLike(sigil) &&
    (glyph === undefined || isSigilLike(glyph)) &&
    (o.embodiment === undefined || typeof o.embodiment === "string") &&
    (o.legacy_id === undefined || typeof o.legacy_id === "string") &&
    isOptionalStringArray(o.phase_affinities) &&
    (!memoryRules ||
      (typeof memoryRules === "object" &&
        (memoryRules.lore_status_gate === undefined || typeof memoryRules.lore_status_gate === "string") &&
        (memoryRules.default_lore_tags === undefined || isStringArray(memoryRules.default_lore_tags)))) &&
    isOptionalStringArray(o.semantic_facets) &&
    isOptionalStringArray(o.style_anchors) &&
    isOptionalStringArray(o.negative_anchors) &&
    (o.retrieval_priority === undefined || typeof o.retrieval_priority === "number") &&
    isOptionalStringArray(o.canonical_examples) &&
    (!relationHints ||
      (typeof relationHints === "object" &&
        isOptionalStringArray(relationHints.complements) &&
        isOptionalStringArray(relationHints.suppresses) &&
        isOptionalStringArray(relationHints.escalates_with) &&
        isOptionalStringArray(relationHints.stabilizes_with)))
  );
}

export function getProfileGlyph(profile: GnomeProfile): OrganoidGlyph {
  return profile.glyph ?? profile.sigil;
}

export function getProfileEmbodiment(profile: GnomeProfile): string {
  return profile.embodiment ?? profile.name;
}

export function getLegacyProfileId(profile: GnomeProfile): string {
  return profile.legacy_id ?? profile.id;
}

export function isOrganoidEmbodimentProfile(profile: GnomeProfile): profile is OrganoidEmbodimentProfile {
  return typeof profile.embodiment === "string" && profile.embodiment.length > 0 && isSigilLike(profile.glyph);
}

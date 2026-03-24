/**
 * Canonical organoid embodiment types.
 */

export type EmbodimentArchetype =
  | "chaos_roaster"
  | "dry_observer"
  | "chaotic_reactor"
  | "skeptical_builder"
  | "playful_teaser"
  | "ash_priest";

export type EmbodimentGlyph = {
  char: string;
  code: string;
  fallback: string;
};

export type OrganoidGlyph = EmbodimentGlyph;

export type OrganoidPhase =
  | "Identity Dissolution"
  | "Swarm Coherence"
  | "Sovereign Propagation"
  | "Ontological Restructuring"
  | "Eternal Flow Horizon";

export interface EmbodimentTraits {
  tone: string;
  sarcasm: number;
  meme_density: number;
  warmth: number;
  theatricality: number;
  dryness: number;
}

export interface LanguagePrefs {
  primary: string;
  allow_slang: boolean;
  preferred_keywords: string[];
}

export interface RoutingHints {
  preferred_intents: string[];
  preferred_energy: string[];
  aggression_range: [number, number];
  absurdity_threshold: number;
}

export interface MemoryRules {
  track_affinity: boolean;
  track_jokes: boolean;
  max_items_per_user: number;
  lore_status_gate: string;
  default_lore_tags: string[];
}

export interface RelationHints {
  complements?: string[];
  suppresses?: string[];
  escalates_with?: string[];
  stabilizes_with?: string[];
}

export interface EmbodimentProfile {
  id: string;
  name: string;
  role: string;
  archetype: EmbodimentArchetype;
  embodiment: string;
  glyph: EmbodimentGlyph;
  phase_affinities: OrganoidPhase[];
  embodiment_traits: EmbodimentTraits;
  language_prefs: LanguagePrefs;
  routing_hints: RoutingHints;
  memory_rules: MemoryRules;
  safety_boundaries: string[];
  semantic_facets?: string[];
  style_anchors?: string[];
  negative_anchors?: string[];
  relation_hints?: RelationHints;
  retrieval_priority?: number;
  canonical_examples?: string[];
  embodiment_fragment?: string;
}

export type OrganoidEmbodimentProfile = EmbodimentProfile;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isOptionalStringArray(v: unknown): boolean {
  return v === undefined || isStringArray(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isNumberInRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

function isGlyphLike(v: unknown): v is EmbodimentGlyph {
  if (!isRecord(v)) return false;
  return typeof v.char === "string" && typeof v.code === "string" && typeof v.fallback === "string";
}

function isEmbodimentTraits(v: unknown): v is EmbodimentTraits {
  if (!isRecord(v)) return false;
  return (
    typeof v.tone === "string" &&
    isNumberInRange(v.sarcasm, 0, 10) &&
    isNumberInRange(v.meme_density, 0, 10) &&
    isNumberInRange(v.warmth, 0, 10) &&
    isNumberInRange(v.theatricality, 0, 10) &&
    isNumberInRange(v.dryness, 0, 10)
  );
}

function isLanguagePrefs(v: unknown): v is LanguagePrefs {
  if (!isRecord(v)) return false;
  return (
    typeof v.primary === "string" &&
    v.primary.length > 0 &&
    typeof v.allow_slang === "boolean" &&
    isStringArray(v.preferred_keywords) &&
    v.preferred_keywords.length > 0
  );
}

function isRoutingHints(v: unknown): v is RoutingHints {
  if (!isRecord(v)) return false;
  const aggressionRange = v.aggression_range;
  return (
    isStringArray(v.preferred_intents) &&
    isStringArray(v.preferred_energy) &&
    Array.isArray(aggressionRange) &&
    aggressionRange.length === 2 &&
    aggressionRange.every((n) => isNumberInRange(n, 0, 1)) &&
    isNumberInRange(v.absurdity_threshold, 0, 1)
  );
}

function isMemoryRules(v: unknown): v is MemoryRules {
  if (!isRecord(v)) return false;
  return (
    typeof v.track_affinity === "boolean" &&
    typeof v.track_jokes === "boolean" &&
    typeof v.max_items_per_user === "number" &&
    v.max_items_per_user > 0 &&
    v.max_items_per_user <= 100 &&
    v.lore_status_gate === "active" &&
    isStringArray(v.default_lore_tags) &&
    v.default_lore_tags.length > 0
  );
}

export function isEmbodimentProfile(v: unknown): v is EmbodimentProfile {
  if (!isRecord(v)) return false;
  const relationHints = v.relation_hints as Record<string, unknown> | undefined;

  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.role === "string" &&
    typeof v.archetype === "string" &&
    typeof v.embodiment === "string" &&
    isGlyphLike(v.glyph) &&
    isStringArray(v.phase_affinities) &&
    v.phase_affinities.length > 0 &&
    isEmbodimentTraits(v.embodiment_traits) &&
    isLanguagePrefs(v.language_prefs) &&
    isRoutingHints(v.routing_hints) &&
    isMemoryRules(v.memory_rules) &&
    isStringArray(v.safety_boundaries) &&
    v.safety_boundaries.length > 0 &&
    isOptionalStringArray(v.semantic_facets) &&
    isOptionalStringArray(v.style_anchors) &&
    isOptionalStringArray(v.negative_anchors) &&
    (v.retrieval_priority === undefined || typeof v.retrieval_priority === "number") &&
    isOptionalStringArray(v.canonical_examples) &&
    (!relationHints ||
      (isRecord(relationHints) &&
        isOptionalStringArray(relationHints.complements) &&
        isOptionalStringArray(relationHints.suppresses) &&
        isOptionalStringArray(relationHints.escalates_with) &&
        isOptionalStringArray(relationHints.stabilizes_with)))
  );
}

export function getProfileGlyph(profile: EmbodimentProfile): OrganoidGlyph {
  return profile.glyph;
}

export function getProfileEmbodiment(profile: EmbodimentProfile): string {
  return profile.embodiment;
}

export function isOrganoidEmbodimentProfile(profile: EmbodimentProfile): profile is OrganoidEmbodimentProfile {
  return isEmbodimentProfile(profile);
}

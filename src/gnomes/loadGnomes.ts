/**
 * Load Gnomes — Load gnome profiles from data/gnomes/*.yaml
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import { registerGnome } from "./registry.js";
import { getProfileGlyph, isGnomeProfile, type GnomeProfile } from "./types.js";

const GNOMES_DATA_DIR = "gnomes";

/**
 * Load all gnome profiles from data/gnomes/*.yaml.
 * Registers them in the registry. Returns loaded profiles.
 */
export async function loadGnomes(): Promise<GnomeProfile[]> {
  const dir = join(process.cwd(), "data", GNOMES_DATA_DIR);

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return [];
    }
    throw err;
  }

  const yamlFiles = entries.filter((e) => e.endsWith(".yaml") || e.endsWith(".yml"));
  const profiles: GnomeProfile[] = [];

  const errors: string[] = [];

  for (const file of yamlFiles) {
    const path = join(dir, file);
    const raw = await readFile(path, "utf-8");
    const parsed = yaml.load(raw) as unknown;

    if (!isGnomeProfile(parsed)) {
      errors.push(`${file}: invalid gnome profile schema`);
      continue;
    }

    const profile = sanitizeProfile(parsed);
    registerGnome(profile);
    profiles.push(profile);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid gnome profiles: ${errors.join("; ")}`);
  }

  return profiles;
}

function sanitizeProfile(p: GnomeProfile): GnomeProfile {
  const glyph = getProfileGlyph(p);
  const trimStringArray = (items: string[]): string[] => items.map((item) => item.trim()).filter(Boolean);
  return {
    ...p,
    id: String(p.id).toLowerCase().trim(),
    legacy_id: String(p.legacy_id ?? p.id).toLowerCase().trim(),
    name: String(p.name).trim(),
    role: String(p.role).trim(),
    embodiment: String(p.embodiment).trim(),
    glyph: {
      char: String(glyph.char).trim(),
      code: String(glyph.code).trim(),
      fallback: String(glyph.fallback).trim(),
    },
    sigil: {
      char: String(p.sigil.char).trim(),
      code: String(p.sigil.code).trim(),
      fallback: String(p.sigil.fallback).trim(),
    },
    voice_traits: {
      tone: String(p.voice_traits.tone).trim(),
      sarcasm: p.voice_traits.sarcasm,
      meme_density: p.voice_traits.meme_density,
      warmth: p.voice_traits.warmth,
      theatricality: p.voice_traits.theatricality,
      dryness: p.voice_traits.dryness,
    },
    language_prefs: {
      primary: String(p.language_prefs.primary).trim(),
      allow_slang: p.language_prefs.allow_slang,
      preferred_keywords: trimStringArray(p.language_prefs.preferred_keywords),
    },
    routing_hints: {
      preferred_intents: trimStringArray(p.routing_hints.preferred_intents),
      preferred_energy: trimStringArray(p.routing_hints.preferred_energy),
      aggression_range: [p.routing_hints.aggression_range[0], p.routing_hints.aggression_range[1]],
      absurdity_threshold: p.routing_hints.absurdity_threshold,
    },
    memory_rules: {
      track_affinity: p.memory_rules.track_affinity,
      track_jokes: p.memory_rules.track_jokes,
      max_items_per_user: p.memory_rules.max_items_per_user,
      lore_status_gate: String(p.memory_rules.lore_status_gate).trim(),
      default_lore_tags: trimStringArray(p.memory_rules.default_lore_tags),
    },
    safety_boundaries: trimStringArray(p.safety_boundaries),
    semantic_facets: p.semantic_facets?.map((facet) => facet.trim()),
    style_anchors: p.style_anchors?.map((anchor) => anchor.trim()),
    negative_anchors: p.negative_anchors?.map((anchor) => anchor.trim()),
    relation_hints: p.relation_hints
      ? {
          complements: p.relation_hints.complements?.map((item) => item.trim()),
          suppresses: p.relation_hints.suppresses?.map((item) => item.trim()),
          escalates_with: p.relation_hints.escalates_with?.map((item) => item.trim()),
          stabilizes_with: p.relation_hints.stabilizes_with?.map((item) => item.trim()),
        }
      : undefined,
    canonical_examples: p.canonical_examples?.map((example) => example.trim()),
    archetype: p.archetype,
  };
}

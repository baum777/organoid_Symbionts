/**
 * Load embodiment profiles from data/embodiments/*.yaml.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import { DATA_DIR } from "../config/dataDir.js";
import { registerEmbodiment } from "./registry.js";
import { isEmbodimentProfile, type EmbodimentProfile, type OrganoidPhase } from "./types.js";

const EMBODIMENTS_DATA_DIR = "embodiments";

export async function loadEmbodiments(): Promise<EmbodimentProfile[]> {
  const dir = join(DATA_DIR, EMBODIMENTS_DATA_DIR);

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

  const yamlFiles = entries.filter((entry) => entry.endsWith(".yaml") || entry.endsWith(".yml"));
  const profiles: EmbodimentProfile[] = [];
  const errors: string[] = [];

  for (const file of yamlFiles) {
    const path = join(dir, file);
    const raw = await readFile(path, "utf-8");
    const parsed = yaml.load(raw) as unknown;

    if (!isEmbodimentProfile(parsed)) {
      errors.push(`${file}: invalid embodiment profile schema`);
      continue;
    }

    const profile = sanitizeProfile(parsed);
    registerEmbodiment(profile);
    profiles.push(profile);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid embodiment profiles: ${errors.join("; ")}`);
  }

  return profiles;
}

function sanitizeProfile(profile: EmbodimentProfile): EmbodimentProfile {
  const trimStringArray = (items: string[] | undefined): string[] => (items ?? []).map((item) => item.trim()).filter(Boolean);

  return {
    ...profile,
    id: String(profile.id).toLowerCase().trim(),
    name: String(profile.name).trim(),
    role: String(profile.role).trim(),
    embodiment: String(profile.embodiment).trim(),
    glyph: {
      char: String(profile.glyph.char).trim(),
      code: String(profile.glyph.code).trim(),
      fallback: String(profile.glyph.fallback).trim(),
    },
    phase_affinities: trimStringArray(profile.phase_affinities) as OrganoidPhase[],
    embodiment_traits: {
      tone: String(profile.embodiment_traits.tone).trim(),
      sarcasm: profile.embodiment_traits.sarcasm,
      meme_density: profile.embodiment_traits.meme_density,
      warmth: profile.embodiment_traits.warmth,
      theatricality: profile.embodiment_traits.theatricality,
      dryness: profile.embodiment_traits.dryness,
    },
    language_prefs: {
      primary: String(profile.language_prefs.primary).trim(),
      allow_slang: profile.language_prefs.allow_slang,
      preferred_keywords: trimStringArray(profile.language_prefs.preferred_keywords),
    },
    routing_hints: {
      preferred_intents: trimStringArray(profile.routing_hints.preferred_intents),
      preferred_energy: trimStringArray(profile.routing_hints.preferred_energy),
      aggression_range: [profile.routing_hints.aggression_range[0], profile.routing_hints.aggression_range[1]],
      absurdity_threshold: profile.routing_hints.absurdity_threshold,
    },
    memory_rules: {
      track_affinity: profile.memory_rules.track_affinity,
      track_jokes: profile.memory_rules.track_jokes,
      max_items_per_user: profile.memory_rules.max_items_per_user,
      lore_status_gate: String(profile.memory_rules.lore_status_gate).trim(),
      default_lore_tags: trimStringArray(profile.memory_rules.default_lore_tags),
    },
    safety_boundaries: trimStringArray(profile.safety_boundaries),
    semantic_facets: profile.semantic_facets?.map((facet) => facet.trim()).filter(Boolean),
    style_anchors: profile.style_anchors?.map((anchor) => anchor.trim()).filter(Boolean),
    negative_anchors: profile.negative_anchors?.map((anchor) => anchor.trim()).filter(Boolean),
    relation_hints: profile.relation_hints
      ? {
          complements: profile.relation_hints.complements?.map((item) => item.trim()).filter(Boolean),
          suppresses: profile.relation_hints.suppresses?.map((item) => item.trim()).filter(Boolean),
          escalates_with: profile.relation_hints.escalates_with?.map((item) => item.trim()).filter(Boolean),
          stabilizes_with: profile.relation_hints.stabilizes_with?.map((item) => item.trim()).filter(Boolean),
        }
      : undefined,
    canonical_examples: profile.canonical_examples?.map((example) => example.trim()).filter(Boolean),
    retrieval_priority: profile.retrieval_priority,
    embodiment_fragment: profile.embodiment_fragment?.trim(),
  };
}

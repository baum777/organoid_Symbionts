/**
 * Load Gnomes — load compatibility profiles from data/gnomes/*.yaml.
 *
 * TODO(ORGANOID-MIGRATION): move the canonical storage path once embodiment-native loading is
 * fully wired. For now, the YAML files may contain Organoid-led names while keeping legacy ids.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import { DATA_DIR } from "../config/dataDir.js";
import { registerEmbodiment, registerGnome } from "./registry.js";
import { isGnomeProfile, type GnomeProfile, type OrganoidEmbodimentProfile } from "./types.js";

const GNOMES_DATA_DIR = "gnomes";

/**
 * Load all gnome profiles from data/gnomes/*.yaml.
 * Registers them in the registry. Returns loaded profiles.
 */
export async function loadGnomes(): Promise<GnomeProfile[]> {
  const dir = join(DATA_DIR, GNOMES_DATA_DIR);

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

export async function loadEmbodiments(): Promise<OrganoidEmbodimentProfile[]> {
  const profiles = await loadGnomes();
  for (const profile of profiles) registerEmbodiment(profile);
  return profiles;
}

function sanitizeProfile(p: GnomeProfile): GnomeProfile {
  return {
    ...p,
    id: String(p.id).toLowerCase().trim(),
    name: String(p.name).trim(),
    role: String(p.role).trim(),
    archetype: p.archetype,
  };
}

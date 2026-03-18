/**
 * Prompt Fragments — Load global safety, shared canon, organoid/gnome-specific fragments
 *
 * Fragment order: globalSafety -> sharedOrganoidCanon -> sharedCanon -> embodiment-specific -> legacy gnome fallback
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { getProfileEmbodiment, type GnomeProfile } from "../gnomes/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve prompts root (repo root / prompts when running from dist, fallback to cwd) */
function getPromptsRoot(): string {
  const distPrompts = join(__dirname, "..", "..", "prompts");
  if (existsSync(distPrompts)) return distPrompts;
  return join(process.cwd(), "prompts");
}

const FRAGMENTS_DIR = "fragments";

function embodimentSlug(embodiment: string): string {
  return embodiment
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * Load fragment by path relative to prompts/fragments/.
 * Returns empty string if file not found.
 */
export function loadFragment(relativePath: string): string {
  const root = getPromptsRoot();
  const fullPath = join(root, FRAGMENTS_DIR, relativePath);
  try {
    return readFileSync(fullPath, "utf-8").trim();
  } catch {
    return "";
  }
}

/** Load global safety rules (always included) */
export function loadGlobalSafety(): string {
  return loadFragment("globalSafety.md") || "Roast content, never identity. No financial advice.";
}

/** Load organoid shared canon (preferred). */
export function loadSharedOrganoidCanon(): string {
  return loadFragment("sharedOrganoidCanon.md");
}

/** Load shared canon (legacy compatibility surface). */
export function loadSharedCanon(): string {
  return loadFragment("sharedCanon.md");
}

/** Load embodiment-specific organoid fragment. */
export function loadEmbodimentFragment(profileOrEmbodiment: GnomeProfile | string): string {
  const embodiment = typeof profileOrEmbodiment === "string"
    ? profileOrEmbodiment
    : getProfileEmbodiment(profileOrEmbodiment);

  const slug = embodimentSlug(embodiment);
  return loadFragment(`embodiments/${slug}.md`);
}

/** Load gnome-specific compatibility fragment by gnome id. */
export function loadGnomeFragment(gnomeId: string): string {
  return loadFragment(`gnomes/${gnomeId}.md`);
}

/** Prefer organoid fragment, fallback to legacy gnome fragment / embedded persona fragment. */
export function loadProfileFragment(profile: GnomeProfile): string {
  return loadEmbodimentFragment(profile) || loadGnomeFragment(profile.id) || profile.persona_fragment || "";
}

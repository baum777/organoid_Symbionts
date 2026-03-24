/**
 * Prompt Fragments — Load global safety, shared canon, organoid/gnome-specific fragments
 *
 * Fragment order: globalSafety -> sharedOrganoidCanon -> embodiment-specific -> legacy fallback (compat only)
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { getLegacyProfileId, getProfileEmbodiment, type GnomeProfile } from "../gnomes/types.js";
import { getGnomesConfig } from "../config/gnomesConfig.js";

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

/** Load canonical organoid fragment, preferring the active embodiment fragment. */
export function loadEmbodimentFragment(profileOrEmbodiment: GnomeProfile | string): string {
  const legacyId = typeof profileOrEmbodiment === "string" ? profileOrEmbodiment : getLegacyProfileId(profileOrEmbodiment);
  const embodiment = typeof profileOrEmbodiment === "string" ? profileOrEmbodiment : getProfileEmbodiment(profileOrEmbodiment);
  const legacySlug = embodimentSlug(legacyId);
  const embodimentSlugValue = embodimentSlug(embodiment);

  return (
    loadFragment(`embodiments/${embodimentSlugValue}.md`) ||
    loadFragment(`organoids/${embodimentSlugValue}.md`) ||
    loadFragment(`organoids/${legacySlug}.md`)
  );
}

/** Load gnome-specific compatibility fragment by gnome id. */
export function loadGnomeFragment(gnomeId: string): string {
  return loadFragment(`gnomes/${gnomeId}.md`);
}

/** Prefer organoid fragment, fallback to legacy gnome fragment only when explicitly compatible. */
export function loadProfileFragment(profile: GnomeProfile): string {
  const { LEGACY_COMPAT } = getGnomesConfig();
  const organoidFragment = loadEmbodimentFragment(profile);
  if (organoidFragment) return organoidFragment;
  if (LEGACY_COMPAT) {
    return loadGnomeFragment(profile.id) || profile.persona_fragment || "";
  }
  return "";
}

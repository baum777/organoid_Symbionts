/**
 * Prompt Fragments — load global safety, shared canon, and identity fragments.
 *
 * Fragment resolution order for embodiment-compatible callers:
 *   globalSafety -> sharedCanon -> organoid embodiment fragment -> legacy gnome fragment fallback
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve prompts root (repo root / prompts when running from dist, fallback to cwd). */
function getPromptsRoot(): string {
  const distPrompts = join(__dirname, "..", "..", "prompts");
  if (existsSync(distPrompts)) return distPrompts;
  return join(process.cwd(), "prompts");
}

const FRAGMENTS_DIR = "fragments";

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

/** Load global safety rules (always included). */
export function loadGlobalSafety(): string {
  return loadFragment("globalSafety.md") || "Roast content, never identity. No financial advice.";
}

/** Load shared canon (civilization lore, shared rules). */
export function loadSharedCanon(): string {
  return loadFragment("sharedCanon.md");
}

/** Load legacy gnome-specific fragment by legacy id. */
export function loadGnomeFragment(gnomeId: string): string {
  return loadFragment(`gnomes/${gnomeId}.md`);
}

/**
 * Load canonical organoid embodiment fragment by compatibility id.
 * Falls back to the legacy gnome fragment tree while the migration is still in progress.
 */
export function loadEmbodimentFragment(embodimentId: string): string {
  return loadFragment(`organoids/${embodimentId}.md`) || loadGnomeFragment(embodimentId);
}

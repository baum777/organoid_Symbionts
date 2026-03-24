/**
 * Prompt fragments for the canonical organoid system.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getProfileEmbodiment, type EmbodimentProfile } from "../embodiments/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve prompts root (repo root / prompts when running from dist, fallback to cwd). */
function getPromptsRoot(): string {
  const distPrompts = join(__dirname, "..", "..", "prompts");
  if (existsSync(distPrompts)) return distPrompts;
  return join(process.cwd(), "prompts");
}

const FRAGMENTS_DIR = "fragments";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** Load fragment by path relative to prompts/fragments/. Returns empty string if file not found. */
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

/** Load the shared organoid canon. */
export function loadSharedOrganoidCanon(): string {
  return loadFragment("sharedOrganoidCanon.md");
}

/** Load the canonical embodiment fragment for a profile or label. */
export function loadEmbodimentFragment(profileOrEmbodiment: EmbodimentProfile | string): string {
  const embodiment =
    typeof profileOrEmbodiment === "string" ? profileOrEmbodiment : getProfileEmbodiment(profileOrEmbodiment);
  const explicitFallback = typeof profileOrEmbodiment === "string" ? "" : profileOrEmbodiment.embodiment_fragment ?? "";
  const slug = slugify(embodiment);

  return loadFragment(`embodiments/${slug}.md`) || explicitFallback;
}

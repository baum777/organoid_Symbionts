/**
 * Prompt fragments for the canonical organoid system.
 *
 * Supports direct asset loading, recursive include resolution, canonical
 * embodiment fragments, legacy gnome fragments, and shared canon/preset
 * surfaces.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
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

const PROMPTS_ROOT = getPromptsRoot();
const FRAGMENTS_DIR = "fragments";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizePromptAssetPath(relativePath: string): string | null {
  const cleaned = relativePath.trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("\0")) return null;
  if (cleaned.split("/").some((part) => part === "..")) return null;

  const resolved = resolve(PROMPTS_ROOT, cleaned);
  const root = resolve(PROMPTS_ROOT);
  if (resolved !== root && !resolved.startsWith(`${root}${sep}`)) {
    return null;
  }
  return resolved;
}

function readPromptAsset(relativePath: string): string {
  const fullPath = normalizePromptAssetPath(relativePath);
  if (!fullPath) return "";
  try {
    return readFileSync(fullPath, "utf-8").trim();
  } catch {
    return "";
  }
}

function resolvePromptIncludes(content: string, seen: Set<string> = new Set()): string {
  const includePattern = /\{\{\s*include:([^}]+)\}\}/g;
  return content.replace(includePattern, (_match, includeTarget: string) => {
    const normalizedTarget = includeTarget.trim();
    const fullPath = normalizePromptAssetPath(normalizedTarget);
    if (!fullPath) return "";
    if (seen.has(fullPath)) return "";

    const nextSeen = new Set(seen);
    nextSeen.add(fullPath);
    const included = readPromptAsset(normalizedTarget);
    if (!included) return "";
    return resolvePromptIncludes(included, nextSeen);
  });
}

/**
 * Load any prompt asset under prompts/ and resolve nested include directives.
 * Returns empty string if file not found or invalid.
 */
export function loadPromptAsset(relativePath: string): string {
  const content = readPromptAsset(relativePath);
  if (!content) return "";
  return resolvePromptIncludes(content);
}

/**
 * Load fragment by path relative to prompts/fragments/.
 * Returns empty string if file not found.
 */
export function loadFragment(relativePath: string): string {
  return loadPromptAsset(join(FRAGMENTS_DIR, relativePath));
}

/**
 * Load markdown or text presets from prompts/presets/.
 */
export function loadPresetFragment(relativePath: string): string {
  return loadPromptAsset(join("presets", relativePath));
}

/** Load global safety rules (always included). */
export function loadGlobalSafety(): string {
  return loadFragment("globalSafety.md") || "Roast content, never identity. No financial advice.";
}

/** Load the shared organoid canon. */
export function loadSharedOrganoidCanon(): string {
  return loadFragment("sharedOrganoidCanon.md") || loadSharedCanon();
}

/** Load shared canon (legacy compatibility surface). */
export function loadSharedCanon(): string {
  return loadFragment("sharedCanon.md");
}

/** Load the canonical embodiment fragment for a profile or label. */
export function loadEmbodimentFragment(profileOrEmbodiment: EmbodimentProfile | string): string {
  const embodiment =
    typeof profileOrEmbodiment === "string" ? profileOrEmbodiment : getProfileEmbodiment(profileOrEmbodiment);
  const explicitFallback = typeof profileOrEmbodiment === "string" ? "" : profileOrEmbodiment.embodiment_fragment ?? "";
  const slug = slugify(embodiment);

  return loadFragment(`embodiments/${slug}.md`) || loadFragment(`organoids/${slug}.md`) || loadFragment(`gnomes/${slug}.md`) || explicitFallback;
}

/** Load gnome-specific compatibility fragment by gnome id. */
export function loadGnomeFragment(gnomeId: string): string {
  return loadFragment(`gnomes/${slugify(gnomeId)}.md`);
}

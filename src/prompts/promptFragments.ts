/**
 * Prompt Fragments — Load global safety, shared canon, organoid/gnome-specific fragments
 *
 * Fragment order: globalSafety -> sharedOrganoidCanon -> embodiment-specific -> legacy fallback (compat only)
 *
 * Supported include syntax inside prompt assets:
 *   {{include:fragments/sharedCanon.md}}
 *   {{include:presets/initiate-symbiosis.md}}
 *
 * Includes are resolved deterministically and fail closed to empty text if a
 * referenced asset is missing or cycles back into itself.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
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

const PROMPTS_ROOT = getPromptsRoot();

function embodimentSlug(embodiment: string): string {
  return embodiment
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
  return loadPromptAsset(join("fragments", relativePath));
}

/**
 * Load markdown or text presets from prompts/presets/.
 */
export function loadPresetFragment(relativePath: string): string {
  return loadPromptAsset(join("presets", relativePath));
}

/** Load global safety rules (always included) */
export function loadGlobalSafety(): string {
  return loadFragment("globalSafety.md") || "Roast content, never identity. No financial advice.";
}

/** Load organoid shared canon (preferred). */
export function loadSharedOrganoidCanon(): string {
  return loadFragment("sharedOrganoidCanon.md") || loadSharedCanon();
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

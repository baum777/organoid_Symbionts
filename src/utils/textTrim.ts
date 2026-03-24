/**
 * Text trim utility — enforces embodiment limit for tweet replies
 */

/**
 * Trims text to max embodiments. Normalizes whitespace; adds "..." when truncated.
 * @param text - Raw text to trim
 * @param max - Maximum allowed embodiments (default 260 for Full Spectrum)
 */
export function trimToLimit(text: string, max = 260): string {
  let trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length > max) {
    trimmed = trimmed.substring(0, max - 3) + "...";
    console.warn(`[textTrim] Auf ${max} Zeichen getrimmt (war ${text.length})`);
  }
  return trimmed;
}

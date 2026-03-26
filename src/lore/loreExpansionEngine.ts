/**
 * Lore Expansion Engine — Bounded candidate proposal flow.
 *
 * Produces lore candidates for review only; never auto-activates or mutates
 * the approved lore store.
 */

import { generateLoreCandidates, type LoreCandidate } from "./loreCandidateGenerator.js";

export interface ExpansionResult {
  candidates: LoreCandidate[];
  rejected: string[];
}

function normalizeMotif(motif: string): string {
  return motif.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Collect and propose lore candidates in a bounded way.
 */
export async function expandLore(
  motifs: string[],
  opts?: { enabled?: boolean; maxCandidates?: number; createdAt?: string },
): Promise<ExpansionResult> {
  const enabled = opts?.enabled ?? false;
  if (!enabled) return { candidates: [], rejected: [] };

  const candidates = generateLoreCandidates(motifs, {
    enabled,
    maxCandidates: opts?.maxCandidates,
    createdAt: opts?.createdAt,
  });

  const accepted = new Set(candidates.map((candidate) => candidate.source_motif));
  const rejected = motifs
    .map(normalizeMotif)
    .filter((motif) => motif.length > 0 && !accepted.has(motif));

  return {
    candidates,
    rejected: Array.from(new Set(rejected)),
  };
}

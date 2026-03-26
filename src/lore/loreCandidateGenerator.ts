/**
 * Lore Candidate Generator — Propose new lore from motifs.
 *
 * The generator is deterministic, bounded, and review-only. It never mutates
 * active lore; it only emits candidate units for human approval.
 */

import { canonicalizeLore } from "./loreCanonicalizer.js";
import { checkLoreSafety } from "./loreSafetyGuard.js";
import { stableHash } from "../utils/hash.js";

export interface LoreCandidate {
  id: string;
  content: string;
  source_motif: string;
  status: "candidate" | "reviewed" | "approved" | "active" | "archived" | "rejected";
  created_at: string;
}

export interface LoreCandidateGeneratorOptions {
  enabled?: boolean;
  maxCandidates?: number;
  createdAt?: string;
}

function normalizeMotif(motif: string): string {
  return motif.trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCase(text: string): string {
  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function classifyMotif(motif: string): "coherence" | "approval" | "prompt" | "onchain" | "signal" | "meme" | "fallback" {
  const value = motif.toLowerCase();
  if (/(resonance|coherence|drift|phase|threshold|signal strength)/.test(value)) return "coherence";
  if (/(consent|approval|consent ritual|onboarding|entry)/.test(value)) return "approval";
  if (/(prompt|fragment|preset|lore unit|lore)/.test(value)) return "prompt";
  if (/(onchain|solana|memo|proof|wallet|mint)/.test(value)) return "onchain";
  if (/(bci|signal|websocket|osc|udp|handshake)/.test(value)) return "signal";
  if (/(meme|viral|x-ready|short-form|caption)/.test(value)) return "meme";
  return "fallback";
}

function renderCandidateContent(motif: string): string {
  const label = titleCase(motif);
  switch (classifyMotif(motif)) {
    case "coherence":
      return `Treat ${label} as a measured runtime signal. Track it as a review-only score, not a claim about agency.`;
    case "approval":
      return `Keep ${label} behind explicit human approval. The system should explain itself first, then wait.`;
    case "prompt":
      return `Represent ${label} as modular prompt material with stable identifiers, review gates, and no auto-activation.`;
    case "onchain":
      return `Limit ${label} to minimal, schema-checked proof. Read-only first, write only after approval.`;
    case "signal":
      return `Simulate ${label} as seeded telemetry. No hardware or consciousness claims, only deterministic phase mapping.`;
    case "meme":
      return `Keep ${label} high-energy but compliant, short, and approval-gated for public surfaces.`;
    default:
      return `Treat ${label} as a candidate-only unit with measurable behavior, explicit approval, and no autonomous activation.`;
  }
}

function makeCandidateId(motif: string, content: string): string {
  return `cand_${stableHash(`${motif}|${content}`).slice(0, 12)}`;
}

/**
 * Generate reviewable lore candidates from motifs.
 * Returns an empty list when disabled or when no valid motifs remain.
 */
export function generateLoreCandidates(
  motifs: string[],
  opts?: LoreCandidateGeneratorOptions,
): LoreCandidate[] {
  if (!opts?.enabled || motifs.length === 0) return [];

  const seen = new Set<string>();
  const createdAt = opts.createdAt ?? new Date().toISOString();
  const limit = Math.max(0, opts.maxCandidates ?? motifs.length);
  const candidates: LoreCandidate[] = [];

  for (const rawMotif of motifs) {
    if (candidates.length >= limit) break;

    const motif = normalizeMotif(rawMotif);
    if (!motif || seen.has(motif)) continue;
    seen.add(motif);

    const content = renderCandidateContent(motif);
    const canonical = canonicalizeLore(content);
    if (!canonical.valid || !canonical.canonical) continue;

    const safety = checkLoreSafety(canonical.canonical);
    if (!safety.allowed) continue;

    candidates.push({
      id: makeCandidateId(motif, canonical.canonical),
      content: canonical.canonical,
      source_motif: motif,
      status: "candidate",
      created_at: createdAt,
    });
  }

  return candidates;
}

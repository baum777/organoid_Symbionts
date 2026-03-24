import type { RetrievalContextPack } from "./types.js";

const DEFAULT_MAX_DIFFS = 6;
const DEFAULT_MAX_NOTES = 4;
const DEFAULT_MAX_ITEMS = 6;

export type HybridShadowComparisonStatus = "shadow_only" | "match" | "divergent";

export interface HybridShadowFieldDiff {
  field:
    | "snapshot"
    | "atoms"
    | "episodes"
    | "projection"
    | "continuity_hooks"
    | "risk_notes"
    | "open_loops"
    | "retrieval_reasons";
  baseline: string[];
  candidate: string[];
  overlap: string[];
  reason: string;
}

export interface HybridShadowComparisonInput {
  baseline?: RetrievalContextPack | null;
  candidate: RetrievalContextPack;
  generated_at?: string;
  limits?: {
    maxDiffs?: number;
    maxNotes?: number;
    maxItems?: number;
  };
}

export interface HybridShadowComparisonReport {
  partner_id: string;
  baseline_snapshot_id?: string | null;
  candidate_snapshot_id: string;
  baseline_projection_id?: string | null;
  candidate_projection_id?: string | null;
  generated_at: string;
  status: HybridShadowComparisonStatus;
  match_score: number;
  diffs: HybridShadowFieldDiff[];
  retained_atom_ids: string[];
  candidate_only_atom_ids: string[];
  baseline_only_atom_ids: string[];
  retained_episode_ids: string[];
  candidate_only_episode_ids: string[];
  baseline_only_episode_ids: string[];
  notes: string[];
}

interface PackView {
  snapshot_key: string[];
  atom_ids: string[];
  episode_ids: string[];
  projection_key: string[];
  continuity_hooks: string[];
  risk_notes: string[];
  open_loops: string[];
  retrieval_reasons: string[];
}

function trimText(value: string | undefined, limit = 240): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
}

function clampLimit(value: number | undefined, fallback: number): number {
  if (!value || Number.isNaN(value) || value <= 0) return fallback;
  return Math.min(value, 12);
}

function unique(values: Array<string | undefined>, limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = trimText(value);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= limit) break;
  }
  return out;
}

function identitySet<T extends { id: string }>(items: T[], limit: number): string[] {
  return unique(items.map((item) => item.id), limit);
}

function projectionKey(pack: RetrievalContextPack): string[] {
  return pack.projection
    ? [pack.projection.projection_id, pack.projection.organoid_id, pack.projection.summary]
    : [];
}

function snapshotKey(pack: RetrievalContextPack): string[] {
  return [pack.snapshot.snapshot_id, pack.snapshot.summary, pack.snapshot.generated_at];
}

function compareExactSequence(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function unionLength(a: string[], b: string[]): number {
  return new Set([...a, ...b]).size;
}

function intersection(a: string[], b: string[]): string[] {
  const right = new Set(b);
  return a.filter((value) => right.has(value));
}

function difference(a: string[], b: string[]): string[] {
  const right = new Set(b);
  return a.filter((value) => !right.has(value));
}

function similarityScore(a: string[], b: string[]): number {
  const union = unionLength(a, b);
  if (union === 0) return 1;
  return intersection(a, b).length / union;
}

function summarizeDiff(field: HybridShadowFieldDiff["field"], baseline: string[], candidate: string[]): HybridShadowFieldDiff | null {
  if (compareExactSequence(baseline, candidate)) return null;
  return {
    field,
    baseline,
    candidate,
    overlap: intersection(baseline, candidate),
    reason:
      field === "snapshot"
        ? "snapshot metadata differs"
        : field === "projection"
          ? "projection metadata differs"
          : `${field.replaceAll("_", " ")} differ`,
  };
}

function buildPackView(pack: RetrievalContextPack): PackView {
  return {
    snapshot_key: snapshotKey(pack),
    atom_ids: identitySet(
      pack.selected_atoms.map((atom) => ({ id: atom.atom_id })),
      DEFAULT_MAX_ITEMS,
    ),
    episode_ids: identitySet(
      pack.selected_episodes.map((episode) => ({ id: episode.episode_id })),
      DEFAULT_MAX_ITEMS,
    ),
    projection_key: projectionKey(pack),
    continuity_hooks: unique(pack.continuity_hooks, DEFAULT_MAX_ITEMS),
    risk_notes: unique(pack.risk_notes, DEFAULT_MAX_ITEMS),
    open_loops: unique(pack.open_loops, DEFAULT_MAX_ITEMS),
    retrieval_reasons: unique(pack.retrieval_reasons, DEFAULT_MAX_ITEMS),
  };
}

export function buildHybridShadowComparisonReport(input: HybridShadowComparisonInput): HybridShadowComparisonReport {
  const now = trimText(input.generated_at) ?? new Date().toISOString();
  const maxDiffs = clampLimit(input.limits?.maxDiffs, DEFAULT_MAX_DIFFS);
  const maxNotes = clampLimit(input.limits?.maxNotes, DEFAULT_MAX_NOTES);
  const maxItems = clampLimit(input.limits?.maxItems, DEFAULT_MAX_ITEMS);

  const candidateView = buildPackView(input.candidate);
  const baselineView = input.baseline ? buildPackView(input.baseline) : null;

  const diffs: HybridShadowFieldDiff[] = [];
  if (baselineView) {
    const candidates: Array<HybridShadowFieldDiff | null> = [
      summarizeDiff("snapshot", baselineView.snapshot_key, candidateView.snapshot_key),
      summarizeDiff("atoms", baselineView.atom_ids.slice(0, maxItems), candidateView.atom_ids.slice(0, maxItems)),
      summarizeDiff("episodes", baselineView.episode_ids.slice(0, maxItems), candidateView.episode_ids.slice(0, maxItems)),
      summarizeDiff("projection", baselineView.projection_key, candidateView.projection_key),
      summarizeDiff("continuity_hooks", baselineView.continuity_hooks, candidateView.continuity_hooks),
      summarizeDiff("risk_notes", baselineView.risk_notes, candidateView.risk_notes),
      summarizeDiff("open_loops", baselineView.open_loops, candidateView.open_loops),
      summarizeDiff("retrieval_reasons", baselineView.retrieval_reasons, candidateView.retrieval_reasons),
    ];
    for (const diff of candidates) {
      if (!diff) continue;
      diffs.push(diff);
      if (diffs.length >= maxDiffs) break;
    }
  }

  const atomOverlap = intersection(
    baselineView?.atom_ids ?? [],
    candidateView.atom_ids,
  );
  const episodeOverlap = intersection(
    baselineView?.episode_ids ?? [],
    candidateView.episode_ids,
  );
  const atomUnion = unionLength(baselineView?.atom_ids ?? [], candidateView.atom_ids);
  const episodeUnion = unionLength(baselineView?.episode_ids ?? [], candidateView.episode_ids);
  const snapshotMatch = baselineView ? compareExactSequence(baselineView.snapshot_key, candidateView.snapshot_key) : true;
  const projectionMatch = baselineView
    ? compareExactSequence(baselineView.projection_key, candidateView.projection_key)
    : true;
  const notePool = unique(
    [
      !baselineView ? "baseline pack not provided; shadow-only comparison" : undefined,
      baselineView && !snapshotMatch ? "snapshot metadata differs" : undefined,
      baselineView && !projectionMatch ? "projection metadata differs" : undefined,
      baselineView && atomUnion > 0 ? `atom overlap: ${atomOverlap.length}/${atomUnion}` : undefined,
      baselineView && episodeUnion > 0 ? `episode overlap: ${episodeOverlap.length}/${episodeUnion}` : undefined,
      baselineView && diffs.length === 0 ? "packs align across compared fields" : undefined,
    ],
    maxNotes,
  );

  const status: HybridShadowComparisonStatus = !baselineView
    ? "shadow_only"
    : diffs.length === 0
      ? "match"
      : "divergent";

  const matchScore = baselineView
    ? Number(
        (
          (snapshotMatch ? 1 : 0) * 0.2 +
          (projectionMatch ? 1 : 0) * 0.15 +
          similarityScore(baselineView.atom_ids, candidateView.atom_ids) * 0.3 +
          similarityScore(baselineView.episode_ids, candidateView.episode_ids) * 0.2 +
          similarityScore(baselineView.continuity_hooks, candidateView.continuity_hooks) * 0.05 +
          similarityScore(baselineView.risk_notes, candidateView.risk_notes) * 0.05 +
          similarityScore(baselineView.open_loops, candidateView.open_loops) * 0.03 +
          similarityScore(baselineView.retrieval_reasons, candidateView.retrieval_reasons) * 0.02
        ).toFixed(4),
      )
    : 1;

  return {
    partner_id: input.candidate.partner_id,
    baseline_snapshot_id: input.baseline?.snapshot.snapshot_id ?? null,
    candidate_snapshot_id: input.candidate.snapshot.snapshot_id,
    baseline_projection_id: input.baseline?.projection?.projection_id ?? null,
    candidate_projection_id: input.candidate.projection?.projection_id ?? null,
    generated_at: now,
    status,
    match_score: matchScore,
    diffs,
    retained_atom_ids: atomOverlap.slice(0, maxItems),
    candidate_only_atom_ids: difference(candidateView.atom_ids, baselineView?.atom_ids ?? []).slice(0, maxItems),
    baseline_only_atom_ids: difference(baselineView?.atom_ids ?? [], candidateView.atom_ids).slice(0, maxItems),
    retained_episode_ids: episodeOverlap.slice(0, maxItems),
    candidate_only_episode_ids: difference(candidateView.episode_ids, baselineView?.episode_ids ?? []).slice(0, maxItems),
    baseline_only_episode_ids: difference(baselineView?.episode_ids ?? [], candidateView.episode_ids).slice(0, maxItems),
    notes: notePool,
  };
}

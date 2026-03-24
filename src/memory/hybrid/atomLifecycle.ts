import { createHash } from "node:crypto";
import type {
  Episode,
  EvidenceReference,
  MemoryAtom,
  MemoryAtomKind,
  MemoryAtomPolarity,
  MemoryAtomStatus,
  RevisionChangeType,
  RevisionEvent,
  StateReference,
} from "./types.js";

const DEFAULT_MAX_STATEMENT_LENGTH = 240;
const DEFAULT_MAX_LIST_ITEMS = 8;

export interface AtomLifecycleInput {
  partner_id: string;
  kind: MemoryAtomKind;
  statement: string;
  polarity?: MemoryAtomPolarity;
  sourceEpisodes: Episode[];
  priorAtom?: MemoryAtom | null;
  now?: string;
}

export interface AtomLifecycleResult {
  atom: MemoryAtom;
  revisionEvent: RevisionEvent;
}

function trimText(value: string | undefined, limit = DEFAULT_MAX_STATEMENT_LENGTH): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeRefs(episodes: Episode[], limit = DEFAULT_MAX_LIST_ITEMS): EvidenceReference[] {
  const out: EvidenceReference[] = [];
  const seen = new Set<string>();
  for (const episode of episodes) {
    for (const ref of episode.evidence_links) {
      const refId = trimText(ref.ref_id);
      if (!refId) continue;
      const key = `${ref.ref_type}:${refId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        ref_id: refId,
        ref_type: ref.ref_type,
        label: trimText(ref.label) ?? (ref.ref_type === "episode" ? "source episode" : undefined),
      });
      if (out.length >= limit) return out;
    }
    const episodeKey = `episode:${episode.episode_id}`;
    if (!seen.has(episodeKey)) {
      seen.add(episodeKey);
      out.push({
        ref_id: episode.episode_id,
        ref_type: "episode",
        label: "source episode",
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function buildAtomId(partnerId: string, kind: MemoryAtomKind, statement: string): string {
  const digest = createHash("sha256").update(`${partnerId}|${kind}|${statement}`).digest("hex").slice(0, 16);
  return `atom:${digest}`;
}

function buildStateRef(atomOrSnapshotId: string, refType: StateReference["ref_type"]): StateReference {
  return {
    ref_id: atomOrSnapshotId,
    ref_type: refType,
  };
}

function inferStatus(priorAtom: MemoryAtom | null | undefined, supportCount: number, contradictionCount: number): MemoryAtomStatus {
  if (priorAtom?.status === "archived") return "archived";
  if (contradictionCount > supportCount) return "contradicted";
  if (supportCount >= 3) return "active";
  if (supportCount >= 1) return "tentative";
  return priorAtom?.status ?? "tentative";
}

function inferChangeType(priorAtom: MemoryAtom | null | undefined, status: MemoryAtomStatus): RevisionChangeType {
  if (!priorAtom) return "create";
  if (status === "contradicted" && priorAtom.status !== "contradicted") return "downgrade";
  if (status === "archived") return "archive";
  return "update";
}

export function createOrUpdateAtom(input: AtomLifecycleInput): AtomLifecycleResult {
  const now = input.now ?? new Date().toISOString();
  const statement = trimText(input.statement) ?? "";
  if (!statement) {
    throw new Error("Atom lifecycle requires a non-empty statement");
  }

  const sourceEpisodes = input.sourceEpisodes.slice(0, DEFAULT_MAX_LIST_ITEMS);
  if (sourceEpisodes.length === 0) {
    throw new Error("Atom lifecycle requires source episodes");
  }

  const priorAtom = input.priorAtom ?? null;
  const supportingEpisodeIds = Array.from(
    new Set([
      ...(priorAtom?.supporting_episode_ids ?? []),
      ...sourceEpisodes.map((episode) => episode.episode_id),
    ]),
  ).slice(0, DEFAULT_MAX_LIST_ITEMS);
  const contradictionEpisodeIds = Array.from(new Set(priorAtom?.contradiction_episode_ids ?? [])).slice(0, DEFAULT_MAX_LIST_ITEMS);
  const evidenceRefs = normalizeRefs(sourceEpisodes, DEFAULT_MAX_LIST_ITEMS);

  const supportCount = Math.max(priorAtom?.support_count ?? 0, supportingEpisodeIds.length);
  const contradictionCount = Math.max(priorAtom?.contradiction_count ?? 0, contradictionEpisodeIds.length);
  const confidenceScore = clampScore(
    Math.max(
      priorAtom?.confidence_score ?? 0,
      sourceEpisodes.reduce((acc, episode) => Math.max(acc, episode.confidence_score), 0),
    ),
  );
  const freshnessScore = clampScore(
    sourceEpisodes.reduce((acc, episode) => Math.max(acc, episode.freshness_score), priorAtom?.freshness_score ?? 0),
  );
  const stabilityScore = clampScore(
    priorAtom
      ? Math.min(1, Math.max(priorAtom.stability_score, Math.min(1, supportCount / (supportCount + contradictionCount || 1))))
      : Math.min(1, supportCount / (supportCount + contradictionCount || 1)),
  );
  const status = inferStatus(priorAtom, supportCount, contradictionCount);
  const atomId = priorAtom?.atom_id ?? buildAtomId(input.partner_id, input.kind, statement);
  const changeType = inferChangeType(priorAtom, status);

  const atom: MemoryAtom = {
    atom_id: atomId,
    partner_id: input.partner_id,
    kind: input.kind,
    statement,
    polarity: input.polarity ?? priorAtom?.polarity ?? "unknown",
    confidence_score: confidenceScore,
    freshness_score: freshnessScore,
    stability_score: stabilityScore,
    support_count: supportCount,
    contradiction_count: contradictionCount,
    supporting_episode_ids: supportingEpisodeIds,
    contradiction_episode_ids: contradictionEpisodeIds,
    evidence_refs: evidenceRefs,
    first_observed_at: priorAtom?.first_observed_at ?? now,
    last_confirmed_at: status === "contradicted" ? priorAtom?.last_confirmed_at : now,
    status,
  };

  const revisionEvent: RevisionEvent = {
    revision_event_id: `rev:${createHash("sha256").update(`${atom.atom_id}|${changeType}|${now}`).digest("hex").slice(0, 16)}`,
    partner_id: input.partner_id,
    change_type: changeType,
    changed_atom_ids: [atom.atom_id],
    source_episode_ids: supportingEpisodeIds.slice(0, DEFAULT_MAX_LIST_ITEMS),
    contradiction_refs: evidenceRefs.slice(0, DEFAULT_MAX_LIST_ITEMS),
    reason: priorAtom ? "atom updated from supporting episodes" : "atom created from supporting episodes",
    before_state_ref: priorAtom ? buildStateRef(priorAtom.atom_id, "atom") : buildStateRef(input.partner_id, "partner"),
    after_state_ref: buildStateRef(atom.atom_id, "atom"),
    created_at: now,
  };

  return { atom, revisionEvent };
}

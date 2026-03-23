import { createHash } from "node:crypto";
import type {
  Episode,
  MemoryAtom,
  OrganoidProjection,
  PartnerSnapshot,
  RetrievalAtomSelection,
  RetrievalContextPack,
  RetrievalEpisodeSelection,
  RetrievalProjectionSelection,
  RetrievalSnapshotSelection,
} from "./types.js";

const DEFAULT_MAX_ATOMS = 5;
const DEFAULT_MAX_EPISODES = 5;
const DEFAULT_MAX_NOTES = 4;
const DEFAULT_MAX_TEXT = 240;

export interface BuildPartnerSnapshotInput {
  partner_id: string;
  atoms: MemoryAtom[];
  episodes: Episode[];
  snapshot_id?: string;
  generated_at?: string;
}

export interface AssembleRetrievalContextPackInput {
  partner_id: string;
  snapshot: PartnerSnapshot;
  atoms: MemoryAtom[];
  episodes: Episode[];
  projection?: OrganoidProjection | null;
  generated_at?: string;
  limits?: {
    maxAtoms?: number;
    maxEpisodes?: number;
    maxNotes?: number;
    maxLoops?: number;
    maxReasons?: number;
  };
}

function trimText(value: string | undefined, limit = DEFAULT_MAX_TEXT): string | undefined {
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

function hashId(prefix: string, input: string): string {
  return `${prefix}:${createHash("sha256").update(input).digest("hex").slice(0, 16)}`;
}

function atomStatusPriority(status: MemoryAtom["status"]): number {
  switch (status) {
    case "active":
      return 3;
    case "tentative":
      return 2;
    case "stale":
      return 1;
    case "contradicted":
      return 0;
    case "archived":
      return -1;
    default:
      return 0;
  }
}

function scoreAtom(atom: MemoryAtom): number {
  return (
    atomStatusPriority(atom.status) * 100 +
    atom.support_count * 10 +
    atom.confidence_score * 8 +
    atom.freshness_score * 6 +
    atom.stability_score * 4 -
    atom.contradiction_count * 12
  );
}

function scoreEpisode(episode: Episode): number {
  return (
    episode.freshness_score * 8 +
    episode.confidence_score * 7 +
    (episode.topic_tags.length > 0 ? 2 : 0) +
    (episode.open_questions.length > 0 ? 1 : 0)
  );
}

function normalizeTopicMap(episodes: Episode[], atoms: MemoryAtom[]): Record<string, number> {
  const topicMap: Record<string, number> = {};
  for (const episode of episodes) {
    for (const tag of episode.topic_tags) {
      const cleaned = trimText(tag);
      if (!cleaned) continue;
      topicMap[cleaned] = (topicMap[cleaned] ?? 0) + 1;
    }
  }
  for (const atom of atoms) {
    const key = `atom:${atom.kind}`;
    topicMap[key] = (topicMap[key] ?? 0) + 1;
  }
  return topicMap;
}

function summarizeTopics(topicMap: Record<string, number>, limit = 3): string[] {
  return Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([topic]) => topic);
}

function summarizeAtoms(atoms: MemoryAtom[], limit = 3): string[] {
  return atoms.slice(0, limit).map((atom) => atom.statement);
}

function summarizeStyle(episodes: Episode[], atoms: MemoryAtom[]): string {
  const toneCounts: Record<string, number> = {};
  const preferenceCounts: Record<string, number> = {};

  for (const episode of episodes) {
    for (const tone of episode.tone_markers) {
      const key = trimText(tone);
      if (!key) continue;
      toneCounts[key] = (toneCounts[key] ?? 0) + 1;
    }
    for (const pref of episode.preferences_observed) {
      const key = trimText(pref);
      if (!key) continue;
      preferenceCounts[key] = (preferenceCounts[key] ?? 0) + 1;
    }
  }

  const topTones = Object.entries(toneCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([value]) => value);
  const topPrefs = Object.entries(preferenceCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([value]) => value);
  const atomKinds = unique(
    atoms.filter((atom) => atom.status === "active" || atom.status === "tentative").map((atom) => atom.kind),
    2,
  );

  return unique(
    [
      topTones.length > 0 ? `tones: ${topTones.join(", ")}` : undefined,
      topPrefs.length > 0 ? `prefs: ${topPrefs.join(", ")}` : undefined,
      atomKinds.length > 0 ? `atoms: ${atomKinds.join(", ")}` : undefined,
    ],
    3,
  ).join("; ");
}

function summarizeRisk(episodes: Episode[], atoms: MemoryAtom[]): string {
  const risks = unique(
    [
      ...episodes.flatMap((episode) => episode.risk_markers),
      ...atoms.filter((atom) => atom.kind === "risk").map((atom) => atom.statement),
    ],
    3,
  );
  return risks.length > 0 ? risks.join("; ") : "no elevated risk markers";
}

function summarizeContinuity(snapshotText: string, atoms: MemoryAtom[], episodes: Episode[], projection?: OrganoidProjection | null): string {
  const hooks = unique(
    [
      ...atoms.filter((atom) => atom.kind === "continuity" && atom.status !== "archived").map((atom) => atom.statement),
      ...episodes.flatMap((episode) => episode.open_questions),
      ...episodes.flatMap((episode) => episode.relationship_markers),
      ...(projection?.continuity_hooks ?? []),
      snapshotText,
    ],
    4,
  );
  return hooks.length > 0 ? hooks.join("; ") : "no continuity hooks";
}

function selectAtoms(atoms: MemoryAtom[], limit: number): MemoryAtom[] {
  return [...atoms]
    .filter((atom) => atom.status !== "archived" && atom.status !== "contradicted")
    .sort((a, b) => scoreAtom(b) - scoreAtom(a) || a.atom_id.localeCompare(b.atom_id))
    .slice(0, limit);
}

function selectEpisodes(episodes: Episode[], limit: number): Episode[] {
  return [...episodes]
    .sort((a, b) => scoreEpisode(b) - scoreEpisode(a) || b.timestamp.localeCompare(a.timestamp) || a.episode_id.localeCompare(b.episode_id))
    .slice(0, limit);
}

export function buildPartnerSnapshot(input: BuildPartnerSnapshotInput): PartnerSnapshot {
  const now = input.generated_at ?? new Date().toISOString();
  const activeAtoms = input.atoms.filter((atom) => atom.status === "active");
  const topicMap = normalizeTopicMap(input.episodes, activeAtoms);
  const topicNames = summarizeTopics(topicMap);
  const atomStatements = summarizeAtoms(activeAtoms, 3);
  const style = summarizeStyle(input.episodes, activeAtoms);
  const risk = summarizeRisk(input.episodes, activeAtoms);
  const continuity = summarizeContinuity("", input.atoms.filter((atom) => atom.status !== "archived"), input.episodes);
  const summary = trimText(
    [
      topicNames.length > 0 ? `topics: ${topicNames.join(", ")}` : undefined,
      atomStatements.length > 0 ? `atoms: ${atomStatements.join(" | ")}` : undefined,
    ]
      .filter(Boolean)
      .join("; "),
    DEFAULT_MAX_TEXT,
  ) ?? "partner snapshot";

  return {
    snapshot_id:
      input.snapshot_id ??
      hashId("snapshot", `${input.partner_id}|${now}|${atomStatements.join("|")}|${topicNames.join("|")}`),
    partner_id: input.partner_id,
    summary,
    active_atom_ids: activeAtoms.map((atom) => atom.atom_id),
    topic_map: topicMap,
    interaction_style_summary: trimText(style, DEFAULT_MAX_TEXT) ?? "no style signals",
    current_risk_summary: trimText(risk, DEFAULT_MAX_TEXT) ?? "no elevated risk markers",
    current_continuity_summary: trimText(continuity, DEFAULT_MAX_TEXT) ?? "no continuity hooks",
    generated_at: now,
    embedding_ref: undefined,
  };
}

export function assembleRetrievalContextPack(input: AssembleRetrievalContextPackInput): RetrievalContextPack {
  const now = input.generated_at ?? new Date().toISOString();
  const maxAtoms = clampLimit(input.limits?.maxAtoms, DEFAULT_MAX_ATOMS);
  const maxEpisodes = clampLimit(input.limits?.maxEpisodes, DEFAULT_MAX_EPISODES);
  const maxNotes = clampLimit(input.limits?.maxNotes, DEFAULT_MAX_NOTES);
  const maxLoops = clampLimit(input.limits?.maxLoops, DEFAULT_MAX_NOTES);
  const maxReasons = clampLimit(input.limits?.maxReasons, DEFAULT_MAX_NOTES);
  const selectedAtoms = selectAtoms(input.atoms, maxAtoms);
  const selectedEpisodes = selectEpisodes(input.episodes, maxEpisodes);
  const projection = input.projection
    ? ({
        projection_id: input.projection.projection_id,
        organoid_id: input.projection.organoid_id,
        summary: trimText(input.projection.projection_summary) ?? input.projection.projection_summary,
        reason: "derived organoid projection",
      } satisfies RetrievalProjectionSelection)
    : null;

  const continuityHooks = unique(
    [
      input.snapshot.current_continuity_summary,
      ...(projection?.summary ? [projection.summary] : []),
      ...selectedAtoms.filter((atom) => atom.kind === "continuity").map((atom) => atom.statement),
      ...selectedEpisodes.flatMap((episode) => episode.relationship_markers),
    ],
    maxNotes,
  );
  const riskNotes = unique(
    [
      input.snapshot.current_risk_summary,
      ...selectedAtoms.filter((atom) => atom.kind === "risk").map((atom) => atom.statement),
      ...selectedEpisodes.flatMap((episode) => episode.risk_markers),
    ],
    maxNotes,
  );
  const openLoops = unique(
    [...selectedEpisodes.flatMap((episode) => episode.open_questions), input.snapshot.current_continuity_summary],
    maxLoops,
  );
  const retrievalReasons = unique(
    [
      `snapshot:${input.snapshot.snapshot_id}`,
      `atoms:${selectedAtoms.length}`,
      `episodes:${selectedEpisodes.length}`,
      projection ? `projection:${projection.projection_id}` : undefined,
      input.snapshot.active_atom_ids.length > 0 ? "active_atom_core" : undefined,
    ],
    maxReasons,
  );

  return {
    partner_id: input.partner_id,
    snapshot: {
      snapshot_id: input.snapshot.snapshot_id,
      summary: input.snapshot.summary,
      generated_at: input.snapshot.generated_at,
      active_atom_ids: input.snapshot.active_atom_ids,
    } satisfies RetrievalSnapshotSelection,
    selected_atoms: selectedAtoms.map(
      (atom): RetrievalAtomSelection => ({
        atom_id: atom.atom_id,
        summary: trimText(atom.statement) ?? atom.statement,
        reason:
          atom.status === "active"
            ? `active atom (${atom.support_count} supports)`
            : atom.status === "tentative"
              ? `tentative atom (${atom.support_count} supports)`
              : `derived atom (${atom.status})`,
        support_count: atom.support_count,
        contradiction_count: atom.contradiction_count,
      }),
    ),
    selected_episodes: selectedEpisodes.map(
      (episode): RetrievalEpisodeSelection => ({
        episode_id: episode.episode_id,
        excerpt: trimText(episode.raw_text_excerpt ?? episode.normalized_text) ?? episode.normalized_text,
        reason:
          episode.open_questions.length > 0
            ? "open question support"
            : episode.topic_tags.length > 0
              ? "topic relevance"
              : "recent evidence",
        timestamp: episode.timestamp,
      }),
    ),
    projection,
    continuity_hooks: continuityHooks,
    risk_notes: riskNotes,
    open_loops: openLoops,
    retrieval_reasons: retrievalReasons,
    generated_at: now,
  };
}

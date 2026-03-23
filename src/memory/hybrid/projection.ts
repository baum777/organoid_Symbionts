import { createHash } from "node:crypto";
import type {
  Episode,
  MemoryAtom,
  OrganoidProjection,
  PartnerSnapshot,
} from "./types.js";

const DEFAULT_MAX_ATOMS = 5;
const DEFAULT_MAX_EPISODES = 5;
const DEFAULT_MAX_SIGNALS = 4;
const DEFAULT_MAX_TOPICS = 4;
const DEFAULT_MAX_HOOKS = 4;
const DEFAULT_TEXT_LIMIT = 240;

export interface BuildOrganoidProjectionInput {
  partner_id: string;
  organoid_id: string;
  snapshot: PartnerSnapshot;
  atoms: MemoryAtom[];
  episodes: Episode[];
  generated_at?: string;
  limits?: {
    maxAtoms?: number;
    maxEpisodes?: number;
    maxSignals?: number;
    maxTopics?: number;
    maxHooks?: number;
  };
}

export interface InvalidateOrganoidProjectionInput {
  projection: OrganoidProjection;
  invalidated_at?: string;
}

function trimText(value: string | undefined, limit = DEFAULT_TEXT_LIMIT): string | undefined {
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

function scoreAtom(atom: MemoryAtom): number {
  const statusScore =
    atom.status === "active"
      ? 300
      : atom.status === "tentative"
        ? 200
        : atom.status === "stale"
          ? 100
          : 0;

  return (
    statusScore +
    atom.support_count * 12 +
    atom.confidence_score * 10 +
    atom.freshness_score * 8 +
    atom.stability_score * 6 -
    atom.contradiction_count * 14
  );
}

function scoreEpisode(episode: Episode): number {
  return (
    episode.freshness_score * 10 +
    episode.confidence_score * 9 +
    episode.topic_tags.length * 2 +
    episode.open_questions.length +
    episode.relationship_markers.length
  );
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

function topTopics(topicMap: Record<string, number>, limit: number): string[] {
  return Object.entries(topicMap)
    .filter(([topic]) => Boolean(trimText(topic)))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([topic]) => topic);
}

function deriveFitSignals(snapshot: PartnerSnapshot, atoms: MemoryAtom[], topics: string[], limit: number): string[] {
  const styleTokens = snapshot.interaction_style_summary
    .split(/[;,]/g)
    .map((part) => trimText(part))
    .filter((part): part is string => Boolean(part));
  const atomKinds = atoms.map((atom) => `atom:${atom.kind}`);
  return unique([...styleTokens, ...atomKinds, ...topics.map((topic) => `topic:${topic}`)], limit);
}

function deriveCautionSignals(snapshot: PartnerSnapshot, atoms: MemoryAtom[], episodes: Episode[], limit: number): string[] {
  return unique(
    [
      snapshot.current_risk_summary,
      ...atoms
        .filter((atom) => atom.status === "stale" || atom.status === "contradicted" || atom.kind === "risk")
        .map((atom) => atom.statement),
      ...episodes.flatMap((episode) => episode.risk_markers),
    ],
    limit,
  );
}

function derivePreferredTopics(topics: string[], atoms: MemoryAtom[], limit: number): string[] {
  return unique(
    [
      ...topics,
      ...atoms
        .filter((atom) => atom.kind === "topic" || atom.kind === "continuity")
        .map((atom) => atom.statement),
    ],
    limit,
  );
}

function deriveAvoidTopics(snapshot: PartnerSnapshot, atoms: MemoryAtom[], episodes: Episode[], limit: number): string[] {
  return unique(
    [
      snapshot.current_risk_summary,
      ...atoms.filter((atom) => atom.kind === "risk" || atom.status === "contradicted").map((atom) => atom.statement),
      ...episodes.flatMap((episode) => episode.risk_markers),
    ],
    limit,
  );
}

function deriveBestInteractionModes(snapshot: PartnerSnapshot, hooks: string[], limit: number): string[] {
  const summary = snapshot.interaction_style_summary.toLowerCase();
  const modes = unique(
    [
      summary.includes("brief") || summary.includes("concise") ? "concise" : undefined,
      summary.includes("question") || summary.includes("curious") || summary.includes("explor") ? "reflective" : undefined,
      summary.includes("risk") || summary.includes("caution") ? "cautious" : undefined,
      hooks.length > 0 || summary.includes("continu") ? "assist" : undefined,
      "observe",
    ],
    limit,
  );
  return modes.length > 0 ? modes : ["observe"];
}

function deriveContinuityHooks(snapshot: PartnerSnapshot, atoms: MemoryAtom[], episodes: Episode[], limit: number): string[] {
  return unique(
    [
      snapshot.current_continuity_summary,
      ...atoms.filter((atom) => atom.kind === "continuity" && atom.status !== "archived").map((atom) => atom.statement),
      ...episodes.flatMap((episode) => episode.relationship_markers),
      ...episodes.flatMap((episode) => episode.open_questions),
    ],
    limit,
  );
}

function summarizeProjection(
  organoidId: string,
  snapshot: PartnerSnapshot,
  topics: string[],
  hooks: string[],
  cautionSignals: string[],
): string {
  const pieces = [
    `organoid ${organoidId}`,
    snapshot.summary,
    topics.length > 0 ? `topics: ${topics.join(", ")}` : undefined,
    hooks.length > 0 ? `hooks: ${hooks.join(", ")}` : undefined,
    cautionSignals.length > 0 ? `caution: ${cautionSignals.join(", ")}` : undefined,
  ];
  return trimText(pieces.filter(Boolean).join("; "), DEFAULT_TEXT_LIMIT) ?? `organoid ${organoidId} projection`;
}

export function buildOrganoidProjection(input: BuildOrganoidProjectionInput): OrganoidProjection {
  const now = trimText(input.generated_at) ?? new Date().toISOString();
  const maxAtoms = clampLimit(input.limits?.maxAtoms, DEFAULT_MAX_ATOMS);
  const maxEpisodes = clampLimit(input.limits?.maxEpisodes, DEFAULT_MAX_EPISODES);
  const maxSignals = clampLimit(input.limits?.maxSignals, DEFAULT_MAX_SIGNALS);
  const maxTopics = clampLimit(input.limits?.maxTopics, DEFAULT_MAX_TOPICS);
  const maxHooks = clampLimit(input.limits?.maxHooks, DEFAULT_MAX_HOOKS);

  const selectedAtoms = selectAtoms(input.atoms, maxAtoms);
  const selectedEpisodes = selectEpisodes(input.episodes, maxEpisodes);
  const topics = topTopics(input.snapshot.topic_map, maxTopics);
  const continuityHooks = deriveContinuityHooks(input.snapshot, selectedAtoms, selectedEpisodes, maxHooks);
  const fitSignals = deriveFitSignals(input.snapshot, selectedAtoms, topics, maxSignals);
  const cautionSignals = deriveCautionSignals(input.snapshot, input.atoms, selectedEpisodes, maxSignals);
  const preferredTopics = derivePreferredTopics(topics, selectedAtoms, maxTopics);
  const avoidTopics = deriveAvoidTopics(input.snapshot, input.atoms, selectedEpisodes, maxTopics);
  const bestInteractionModes = deriveBestInteractionModes(input.snapshot, continuityHooks, maxSignals);

  const projectionSummary = summarizeProjection(
    input.organoid_id,
    input.snapshot,
    preferredTopics,
    continuityHooks,
    cautionSignals,
  );

  return {
    projection_id: hashId(
      "projection",
      [
        input.partner_id,
        input.organoid_id,
        input.snapshot.snapshot_id,
        selectedAtoms.map((atom) => atom.atom_id).join(","),
        selectedEpisodes.map((episode) => episode.episode_id).join(","),
      ].join("|"),
    ),
    partner_id: input.partner_id,
    organoid_id: input.organoid_id,
    authority: "derived",
    derived_from_snapshot_id: input.snapshot.snapshot_id,
    generated_at: now,
    invalidated_at: undefined,
    projection_summary: projectionSummary,
    fit_signals: fitSignals,
    caution_signals: cautionSignals,
    preferred_topics: preferredTopics,
    avoid_topics: avoidTopics,
    best_interaction_modes: bestInteractionModes,
    continuity_hooks: continuityHooks,
    retrieval_priority_weights: {
      continuity: continuityHooks.length > 0 ? 0.85 : 0.5,
      caution: cautionSignals.length > 0 ? 0.75 : 0.35,
      topics: preferredTopics.length > 0 ? 0.7 : 0.4,
    },
    supporting_core_atom_ids: selectedAtoms.map((atom) => atom.atom_id),
    supporting_episode_ids: selectedEpisodes.map((episode) => episode.episode_id),
  };
}

export function invalidateOrganoidProjection(input: InvalidateOrganoidProjectionInput): OrganoidProjection {
  const invalidatedAt = trimText(input.invalidated_at) ?? new Date().toISOString();
  if (input.projection.invalidated_at && input.projection.invalidated_at >= invalidatedAt) {
    return { ...input.projection };
  }
  return {
    ...input.projection,
    invalidated_at: invalidatedAt,
  };
}

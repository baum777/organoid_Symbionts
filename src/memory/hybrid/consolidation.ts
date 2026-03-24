import { createHash } from "node:crypto";
import type {
  ConsolidationJob,
  ConsolidationMode,
  ConsolidationTrigger,
  ConsolidationStatus,
  Episode,
  EvidenceReference,
  MemoryAtom,
  MemoryAtomStatus,
  PartnerSnapshot,
  RevisionChangeType,
  RevisionEvent,
  StateReference,
} from "./types.js";

const DEFAULT_MAX_ATOMS = 6;
const DEFAULT_MAX_EPISODES = 6;
const DEFAULT_MAX_NOTES = 4;
const DEFAULT_MAX_REVISION_EVENTS = 6;
const DEFAULT_TEXT_LIMIT = 240;

export interface ConsolidationPlanInput {
  partner_id: string;
  atoms: MemoryAtom[];
  episodes: Episode[];
  priorSnapshot?: PartnerSnapshot | null;
  mode?: ConsolidationMode;
  trigger?: ConsolidationTrigger;
  reason?: string;
  now?: string;
  limits?: {
    maxAtoms?: number;
    maxEpisodes?: number;
    maxNotes?: number;
    maxRevisionEvents?: number;
  };
  targetProjectionIds?: string[];
}

export interface ConsolidationAtomTransition {
  atom_id: string;
  from_status: MemoryAtomStatus;
  to_status: MemoryAtomStatus;
  change_type: RevisionChangeType;
  reason: string;
  source_episode_ids: string[];
}

export interface ConsolidationPlan {
  job: ConsolidationJob;
  atom_transitions: ConsolidationAtomTransition[];
  revision_events: RevisionEvent[];
  drift_notes: string[];
  refresh_snapshot: boolean;
}

interface AtomAssessment {
  atom: MemoryAtom;
  nextStatus: MemoryAtomStatus;
  changeType: RevisionChangeType;
  reason: string;
  priority: number;
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

function buildStateRef(refId: string, refType: StateReference["ref_type"]): StateReference {
  return {
    ref_id: refId,
    ref_type: refType,
  };
}

function scoreEpisode(episode: Episode): number {
  return (
    episode.freshness_score * 10 +
    episode.confidence_score * 9 +
    episode.open_questions.length * 2 +
    episode.topic_tags.length +
    episode.risk_markers.length
  );
}

function scoreAtomForSelection(atom: MemoryAtom, assessment: AtomAssessment | null): number {
  const transitionBonus = assessment
    ? assessment.nextStatus === "contradicted"
      ? 300
      : assessment.nextStatus === "stale"
        ? 200
        : 100
    : 0;

  return (
    transitionBonus +
    atom.support_count * 12 +
    atom.confidence_score * 10 +
    atom.freshness_score * 8 +
    atom.stability_score * 6 -
    atom.contradiction_count * 14 +
    (atom.status === "active" ? 12 : atom.status === "tentative" ? 8 : 0)
  );
}

function sortAtomsByReviewPriority(atoms: MemoryAtom[]): MemoryAtom[] {
  return [...atoms].sort((a, b) => {
    const assessmentA = assessAtom(a);
    const assessmentB = assessAtom(b);
    const scoreDiff = scoreAtomForSelection(b, assessmentB) - scoreAtomForSelection(a, assessmentA);
    if (scoreDiff !== 0) return scoreDiff;
    return a.atom_id.localeCompare(b.atom_id);
  });
}

function selectAtoms(atoms: MemoryAtom[], limit: number): MemoryAtom[] {
  return sortAtomsByReviewPriority(atoms.filter((atom) => atom.status !== "archived")).slice(0, limit);
}

function selectEpisodes(episodes: Episode[], limit: number): Episode[] {
  return [...episodes]
    .sort((a, b) => scoreEpisode(b) - scoreEpisode(a) || b.timestamp.localeCompare(a.timestamp) || a.episode_id.localeCompare(b.episode_id))
    .slice(0, limit);
}

function evidenceRefsFromEpisodeIds(episodeIds: string[], label: string, limit: number): EvidenceReference[] {
  return unique(episodeIds, limit).map((episodeId) => ({
    ref_id: episodeId,
    ref_type: "episode",
    label,
  }));
}

function assessAtom(atom: MemoryAtom): AtomAssessment | null {
  if (atom.status === "archived") return null;

  if (atom.contradiction_count > atom.support_count && atom.status !== "contradicted") {
    return {
      atom,
      nextStatus: "contradicted",
      changeType: "downgrade",
      reason: "contradictions exceed supporting evidence",
      priority: 3,
    };
  }

  if ((atom.status === "active" || atom.status === "tentative") && (atom.freshness_score < 0.4 || atom.stability_score < 0.4)) {
    return {
      atom,
      nextStatus: "stale",
      changeType: "downgrade",
      reason: "freshness or stability dropped below consolidation threshold",
      priority: 2,
    };
  }

  if (atom.status === "tentative" && atom.support_count >= 3 && atom.contradiction_count === 0 && atom.freshness_score >= 0.5) {
    return {
      atom,
      nextStatus: "active",
      changeType: "update",
      reason: "support reached activation threshold",
      priority: 1,
    };
  }

  if (atom.status === "stale" && atom.support_count >= 2 && atom.contradiction_count === 0 && atom.freshness_score >= 0.6) {
    return {
      atom,
      nextStatus: "active",
      changeType: "update",
      reason: "recent evidence restored active status",
      priority: 1,
    };
  }

  return null;
}

function buildTransition(atom: MemoryAtom, assessment: AtomAssessment): ConsolidationAtomTransition {
  return {
    atom_id: atom.atom_id,
    from_status: atom.status,
    to_status: assessment.nextStatus,
    change_type: assessment.changeType,
    reason: assessment.reason,
    source_episode_ids: unique(
      [...atom.supporting_episode_ids, ...atom.contradiction_episode_ids],
      DEFAULT_MAX_EPISODES,
    ),
  };
}

function buildRevisionEvent(partnerId: string, atom: MemoryAtom, transition: ConsolidationAtomTransition, now: string): RevisionEvent {
  const normalizedNow = trimText(now) ?? new Date().toISOString();
  const eventSeed = [
    partnerId,
    atom.atom_id,
    transition.from_status,
    transition.to_status,
    transition.change_type,
    normalizedNow,
  ].join("|");

  return {
    revision_event_id: hashId("rev", eventSeed),
    partner_id: partnerId,
    change_type: transition.change_type,
    changed_atom_ids: [atom.atom_id],
    source_episode_ids: unique(
      [...transition.source_episode_ids],
      DEFAULT_MAX_EPISODES,
    ),
    contradiction_refs:
      transition.to_status === "contradicted"
        ? evidenceRefsFromEpisodeIds(
            atom.contradiction_episode_ids.length > 0 ? atom.contradiction_episode_ids : atom.supporting_episode_ids,
            "consolidation contradiction evidence",
            DEFAULT_MAX_EPISODES,
          )
        : [],
    reason: transition.reason,
    before_state_ref: buildStateRef(atom.atom_id, "atom"),
    after_state_ref: buildStateRef(atom.atom_id, "atom"),
    created_at: normalizedNow,
  };
}

function buildJobReason(input: ConsolidationPlanInput, selectedAtoms: MemoryAtom[], transitions: ConsolidationAtomTransition[]): string {
  const parts = [
    trimText(input.reason),
    transitions.length > 0
      ? `status transitions: ${transitions.length}`
      : `review selected atoms: ${selectedAtoms.length}`,
    input.priorSnapshot ? `prior snapshot: ${input.priorSnapshot.snapshot_id}` : undefined,
  ];
  return trimText(parts.filter(Boolean).join("; "), DEFAULT_TEXT_LIMIT) ?? "hybrid consolidation";
}

function buildTargetSnapshotId(input: ConsolidationPlanInput, now: string, selectedAtoms: MemoryAtom[], selectedEpisodes: Episode[]): string | undefined {
  if (!input.priorSnapshot && selectedAtoms.length === 0 && selectedEpisodes.length === 0) return undefined;
  const seed = [
    input.partner_id,
    input.priorSnapshot?.snapshot_id ?? "",
    now,
    selectedAtoms.map((atom) => atom.atom_id).join(","),
    selectedEpisodes.map((episode) => episode.episode_id).join(","),
  ].join("|");
  return hashId("snapshot", seed);
}

export function buildConsolidationPlan(input: ConsolidationPlanInput): ConsolidationPlan {
  const now = trimText(input.now) ?? new Date().toISOString();
  const maxAtoms = clampLimit(input.limits?.maxAtoms, DEFAULT_MAX_ATOMS);
  const maxEpisodes = clampLimit(input.limits?.maxEpisodes, DEFAULT_MAX_EPISODES);
  const maxNotes = clampLimit(input.limits?.maxNotes, DEFAULT_MAX_NOTES);
  const maxRevisionEvents = clampLimit(input.limits?.maxRevisionEvents, DEFAULT_MAX_REVISION_EVENTS);

  const selectedAtoms = selectAtoms(input.atoms, maxAtoms);
  const selectedEpisodes = selectEpisodes(input.episodes, maxEpisodes);
  const assessments = selectedAtoms
    .map((atom) => assessAtom(atom))
    .filter((assessment): assessment is AtomAssessment => assessment !== null);
  const transitions = assessments.slice(0, maxRevisionEvents).map((assessment) => buildTransition(assessment.atom, assessment));
  const revisionEvents = transitions.slice(0, maxRevisionEvents).map((transition) => {
    const atom = selectedAtoms.find((candidate) => candidate.atom_id === transition.atom_id);
    if (!atom) {
      throw new Error("Consolidation plan lost atom context for revision event");
    }
    return buildRevisionEvent(input.partner_id, atom, transition, now);
  });

  const staleAtomIds = transitions.filter((transition) => transition.to_status === "stale").map((transition) => transition.atom_id);
  const contradictedAtomIds = transitions
    .filter((transition) => transition.to_status === "contradicted")
    .map((transition) => transition.atom_id);
  const restoredAtomIds = transitions
    .filter((transition) => transition.from_status !== "active" && transition.to_status === "active")
    .map((transition) => transition.atom_id);
  const refreshSnapshot = transitions.length > 0;
  const targetSnapshotId = buildTargetSnapshotId(input, now, selectedAtoms, selectedEpisodes);
  const targetProjectionIds = unique(input.targetProjectionIds ?? [], maxNotes);

  const driftNotes = unique(
    [
      `selected atoms: ${selectedAtoms.length}`,
      `selected episodes: ${selectedEpisodes.length}`,
      transitions.length > 0 ? `status transitions: ${transitions.length}` : undefined,
      contradictedAtomIds.length > 0 ? `contradicted atoms: ${contradictedAtomIds.join(", ")}` : undefined,
      staleAtomIds.length > 0 ? `stale atoms: ${staleAtomIds.join(", ")}` : undefined,
      restoredAtomIds.length > 0 ? `restored atoms: ${restoredAtomIds.join(", ")}` : undefined,
      refreshSnapshot ? `snapshot refresh required: ${targetSnapshotId ?? "pending"}` : undefined,
    ],
    maxNotes,
  );

  const mode = input.mode ?? (transitions.length > 0 || selectedEpisodes.length > 0 ? "incremental" : "periodic");
  const trigger = input.trigger ?? (selectedEpisodes.length > 0 ? "new_episode" : input.priorSnapshot ? "cadence" : "manual");

  const job: ConsolidationJob = {
    job_id: hashId(
      "job",
      [
        input.partner_id,
        mode,
        trigger,
        now,
        selectedAtoms.map((atom) => atom.atom_id).join(","),
        selectedEpisodes.map((episode) => episode.episode_id).join(","),
      ].join("|"),
    ),
    partner_id: input.partner_id,
    mode,
    trigger,
    status: "queued" satisfies ConsolidationStatus,
    requested_at: now,
    input_episode_ids: selectedEpisodes.map((episode) => episode.episode_id),
    input_atom_ids: selectedAtoms.map((atom) => atom.atom_id),
    reason: buildJobReason(input, selectedAtoms, transitions),
    prior_snapshot_id: input.priorSnapshot?.snapshot_id,
    target_snapshot_id: refreshSnapshot ? targetSnapshotId : undefined,
    target_projection_ids: targetProjectionIds.length > 0 ? targetProjectionIds : undefined,
  };

  return {
    job,
    atom_transitions: transitions,
    revision_events: revisionEvents,
    drift_notes: driftNotes,
    refresh_snapshot: refreshSnapshot,
  };
}

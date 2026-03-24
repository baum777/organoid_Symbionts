export const HYBRID_CONTRACT_VERSION = "v1" as const;

export const HYBRID_OBJECT_FAMILIES = [
  "Partner",
  "Episode",
  "MemoryAtom",
  "PartnerSnapshot",
  "OrganoidProjection",
  "RetrievalContextPack",
  "ConsolidationJob",
  "RevisionEvent",
] as const;

export type HybridObjectFamily = (typeof HYBRID_OBJECT_FAMILIES)[number];

export type HybridAuthorityTier = "authoritative" | "derived" | "assembled" | "workflow" | "audit";

export const HYBRID_OBJECT_AUTHORITIES: Record<HybridObjectFamily, HybridAuthorityTier> = {
  Partner: "authoritative",
  Episode: "authoritative",
  MemoryAtom: "authoritative",
  PartnerSnapshot: "derived",
  OrganoidProjection: "derived",
  RetrievalContextPack: "assembled",
  ConsolidationJob: "workflow",
  RevisionEvent: "audit",
};

export type PartnerStatus = "active" | "inactive" | "merged" | "archived";

export type MemoryAtomKind =
  | "claim"
  | "trait"
  | "preference"
  | "habit"
  | "continuity"
  | "risk"
  | "topic";

export type MemoryAtomPolarity = "positive" | "negative" | "mixed" | "unknown";

export type MemoryAtomStatus = "tentative" | "active" | "stale" | "contradicted" | "archived";

export type EpisodeOutcome = "informative" | "neutral" | "conflicted" | "blocked" | "unknown";

export type EpisodeRole = "user" | "assistant" | "observed" | "mixed";

export type ConsolidationMode = "incremental" | "periodic" | "triggered";

export type ConsolidationTrigger = "new_episode" | "cadence" | "contradiction" | "manual";

export type ConsolidationStatus = "queued" | "running" | "completed" | "failed";

export type RevisionChangeType = "create" | "update" | "archive" | "split" | "downgrade" | "merge";

export interface EvidenceReference {
  ref_id: string;
  ref_type: "episode" | "artifact" | "external" | "snapshot" | "revision_event";
  label?: string;
}

export interface StateReference {
  ref_id: string;
  ref_type: "partner" | "atom" | "snapshot" | "projection" | "context_pack";
}

export interface Partner {
  partner_id: string;
  platform_ids: string[];
  handles: string[];
  display_names: string[];
  bio_snapshot?: string;
  author_type_guess?: string;
  status: PartnerStatus;
  created_at: string;
  last_seen_at: string;
}

export interface Episode {
  episode_id: string;
  partner_id: string;
  platform: string;
  source_type: string;
  conversation_id?: string;
  source_ids?: {
    platform_message_id?: string;
    platform_thread_id?: string;
    external_message_id?: string;
  };
  timestamp: string;
  raw_text_excerpt?: string;
  normalized_text: string;
  language?: string;
  topic_tags: string[];
  signal_profile_ref?: string;
  outcome: EpisodeOutcome;
  interaction_role: EpisodeRole;
  open_questions: string[];
  claims_observed: string[];
  preferences_observed: string[];
  tone_markers: string[];
  relationship_markers: string[];
  risk_markers: string[];
  evidence_links: EvidenceReference[];
  embedding_ref?: string;
  freshness_score: number;
  confidence_score: number;
}

export interface MemoryAtom {
  atom_id: string;
  partner_id: string;
  kind: MemoryAtomKind;
  statement: string;
  polarity: MemoryAtomPolarity;
  confidence_score: number;
  freshness_score: number;
  stability_score: number;
  support_count: number;
  contradiction_count: number;
  supporting_episode_ids: string[];
  contradiction_episode_ids: string[];
  evidence_refs: EvidenceReference[];
  first_observed_at: string;
  last_confirmed_at?: string;
  status: MemoryAtomStatus;
}

export interface PartnerSnapshot {
  snapshot_id: string;
  partner_id: string;
  summary: string;
  active_atom_ids: string[];
  topic_map: Record<string, number>;
  interaction_style_summary: string;
  current_risk_summary: string;
  current_continuity_summary: string;
  generated_at: string;
  embedding_ref?: string;
}

export interface OrganoidProjection {
  projection_id: string;
  partner_id: string;
  organoid_id: string;
  authority: "derived";
  derived_from_snapshot_id?: string;
  generated_at: string;
  invalidated_at?: string;
  projection_summary: string;
  fit_signals: string[];
  caution_signals: string[];
  preferred_topics: string[];
  avoid_topics: string[];
  best_interaction_modes: string[];
  continuity_hooks: string[];
  retrieval_priority_weights: Record<string, number>;
  supporting_core_atom_ids: string[];
  supporting_episode_ids: string[];
}

export interface RetrievalAtomSelection {
  atom_id: string;
  summary: string;
  reason: string;
  support_count: number;
  contradiction_count: number;
}

export interface RetrievalEpisodeSelection {
  episode_id: string;
  excerpt: string;
  reason: string;
  timestamp: string;
}

export interface RetrievalProjectionSelection {
  projection_id: string;
  organoid_id: string;
  summary: string;
  reason: string;
}

export interface RetrievalSnapshotSelection {
  snapshot_id: string;
  summary: string;
  generated_at: string;
  active_atom_ids: string[];
}

export interface RetrievalContextPack {
  partner_id: string;
  snapshot: RetrievalSnapshotSelection;
  selected_atoms: RetrievalAtomSelection[];
  selected_episodes: RetrievalEpisodeSelection[];
  projection?: RetrievalProjectionSelection | null;
  continuity_hooks: string[];
  risk_notes: string[];
  open_loops: string[];
  retrieval_reasons: string[];
  generated_at: string;
}

export interface ConsolidationJob {
  job_id: string;
  partner_id: string;
  mode: ConsolidationMode;
  trigger: ConsolidationTrigger;
  status: ConsolidationStatus;
  requested_at: string;
  input_episode_ids: string[];
  input_atom_ids: string[];
  reason: string;
  prior_snapshot_id?: string;
  target_snapshot_id?: string;
  target_projection_ids?: string[];
}

export interface RevisionEvent {
  revision_event_id: string;
  partner_id: string;
  change_type: RevisionChangeType;
  changed_atom_ids: string[];
  source_episode_ids: string[];
  contradiction_refs: EvidenceReference[];
  reason: string;
  before_state_ref: StateReference;
  after_state_ref: StateReference;
  created_at: string;
}

export type HybridMemoryObject =
  | Partner
  | Episode
  | MemoryAtom
  | PartnerSnapshot
  | OrganoidProjection
  | RetrievalContextPack
  | ConsolidationJob
  | RevisionEvent;

export const HYBRID_MEMORY_OBJECT_FIELD_LIMITS = {
  partner_platform_ids_min: 0,
  episode_selected_items_min: 0,
  atom_selected_items_min: 0,
  projection_selected_items_min: 0,
} as const;

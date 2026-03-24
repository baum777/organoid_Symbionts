import { createHash } from "node:crypto";
import type {
  Episode,
  EpisodeOutcome,
  EpisodeRole,
  EvidenceReference,
  Partner,
  PartnerStatus,
} from "./types.js";
import type { HybridStore } from "./store.js";

const DEFAULT_LIST_LIMIT = 12;
const DEFAULT_TEXT_LIMIT = 280;
const DEFAULT_SCORE = 0.5;

export interface HybridPartnerInput {
  partner_id: string;
  platform_ids?: string[];
  handles?: string[];
  display_names?: string[];
  bio_snapshot?: string;
  author_type_guess?: string;
  status?: PartnerStatus;
}

export interface HybridEpisodeInput {
  episode_id?: string;
  platform: string;
  source_type: string;
  conversation_id?: string;
  source_ids?: {
    platform_message_id?: string;
    platform_thread_id?: string;
    external_message_id?: string;
  };
  timestamp?: string;
  raw_text_excerpt?: string;
  normalized_text?: string;
  language?: string;
  topic_tags?: string[];
  signal_profile_ref?: string;
  outcome?: EpisodeOutcome;
  interaction_role?: EpisodeRole;
  open_questions?: string[];
  claims_observed?: string[];
  preferences_observed?: string[];
  tone_markers?: string[];
  relationship_markers?: string[];
  risk_markers?: string[];
  evidence_links?: EvidenceReference[];
  embedding_ref?: string;
  freshness_score?: number;
  confidence_score?: number;
}

export interface HybridEpisodeWriteInput {
  partner: HybridPartnerInput;
  episode: HybridEpisodeInput;
  limits?: {
    maxListItems?: number;
    maxTextLength?: number;
  };
}

export interface HybridEpisodeWriteResult {
  partner: Partner;
  episode: Episode;
  partnerCreated: boolean;
}

function trimText(value: string | undefined, limit = DEFAULT_TEXT_LIMIT): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
}

function clampScore(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_SCORE;
  return Math.min(1, Math.max(0, value));
}

function normalizeStringList(values: string[] | undefined, limit: number): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = trimText(value, DEFAULT_TEXT_LIMIT);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeEvidenceLinks(values: EvidenceReference[] | undefined, limit: number): EvidenceReference[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: EvidenceReference[] = [];
  for (const value of values) {
    const refId = trimText(value.ref_id, DEFAULT_TEXT_LIMIT);
    if (!refId) continue;
    const refType = value.ref_type;
    const key = `${refType}:${refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ref_id: refId,
      ref_type: refType,
      label: trimText(value.label, DEFAULT_TEXT_LIMIT),
    });
    if (out.length >= limit) break;
  }
  return out;
}

function compareIsoTimestamps(a: string | undefined, b: string | undefined): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function buildEpisodeId(partnerId: string, input: HybridEpisodeInput, timestamp: string, normalizedText: string): string {
  const seed = [
    partnerId,
    input.platform,
    input.source_type,
    input.conversation_id ?? "",
    input.source_ids?.platform_message_id ?? "",
    input.source_ids?.platform_thread_id ?? "",
    input.source_ids?.external_message_id ?? "",
    timestamp,
    normalizedText,
  ].join("|");
  const digest = createHash("sha256").update(seed).digest("hex").slice(0, 16);
  return `episode:${digest}`;
}

function normalizePartner(partner: HybridPartnerInput, existing: Partner | null, episodeTimestamp: string, listLimit: number): Partner {
  const platformIds = normalizeStringList(
    [...(existing?.platform_ids ?? []), ...(partner.platform_ids ?? [])],
    listLimit,
  );
  const handles = normalizeStringList([...((existing?.handles ?? []) as string[]), ...(partner.handles ?? [])], listLimit);
  const displayNames = normalizeStringList(
    [...(existing?.display_names ?? []), ...(partner.display_names ?? [])],
    listLimit,
  );
  const createdAt = existing?.created_at ?? episodeTimestamp;
  const lastSeenAt = compareIsoTimestamps(existing?.last_seen_at, episodeTimestamp) >= 0
    ? existing?.last_seen_at ?? episodeTimestamp
    : episodeTimestamp;

  return {
    partner_id: partner.partner_id,
    platform_ids: platformIds,
    handles,
    display_names: displayNames,
    bio_snapshot: trimText(partner.bio_snapshot ?? existing?.bio_snapshot, 800),
    author_type_guess: trimText(partner.author_type_guess ?? existing?.author_type_guess, 120),
    status: partner.status ?? existing?.status ?? "active",
    created_at: createdAt,
    last_seen_at: lastSeenAt,
  };
}

function normalizeEpisode(
  partnerId: string,
  input: HybridEpisodeInput,
  listLimit: number,
  textLimit: number,
): Episode {
  const timestamp = trimText(input.timestamp) ?? new Date().toISOString();
  const normalizedText = trimText(input.normalized_text ?? input.raw_text_excerpt, textLimit);
  if (!normalizedText) {
    throw new Error("Hybrid episode write requires normalized_text or raw_text_excerpt");
  }

  const rawTextExcerpt = trimText(input.raw_text_excerpt, textLimit);
  const topicTags = normalizeStringList(input.topic_tags, listLimit);
  const openQuestions = normalizeStringList(input.open_questions, listLimit);
  const claimsObserved = normalizeStringList(input.claims_observed, listLimit);
  const preferencesObserved = normalizeStringList(input.preferences_observed, listLimit);
  const toneMarkers = normalizeStringList(input.tone_markers, listLimit);
  const relationshipMarkers = normalizeStringList(input.relationship_markers, listLimit);
  const riskMarkers = normalizeStringList(input.risk_markers, listLimit);
  const evidenceLinks = normalizeEvidenceLinks(input.evidence_links, listLimit);

  return {
    episode_id: trimText(input.episode_id) ?? buildEpisodeId(partnerId, input, timestamp, normalizedText),
    partner_id: partnerId,
    platform: trimText(input.platform) ?? "",
    source_type: trimText(input.source_type) ?? "",
    conversation_id: trimText(input.conversation_id, textLimit),
    source_ids: input.source_ids
      ? {
          platform_message_id: trimText(input.source_ids.platform_message_id, textLimit),
          platform_thread_id: trimText(input.source_ids.platform_thread_id, textLimit),
          external_message_id: trimText(input.source_ids.external_message_id, textLimit),
        }
      : undefined,
    timestamp,
    raw_text_excerpt: rawTextExcerpt,
    normalized_text: normalizedText,
    language: trimText(input.language, 32),
    topic_tags: topicTags,
    signal_profile_ref: trimText(input.signal_profile_ref, textLimit),
    outcome: input.outcome ?? "unknown",
    interaction_role: input.interaction_role ?? "mixed",
    open_questions: openQuestions,
    claims_observed: claimsObserved,
    preferences_observed: preferencesObserved,
    tone_markers: toneMarkers,
    relationship_markers: relationshipMarkers,
    risk_markers: riskMarkers,
    evidence_links: evidenceLinks,
    embedding_ref: trimText(input.embedding_ref, textLimit),
    freshness_score: clampScore(input.freshness_score),
    confidence_score: clampScore(input.confidence_score),
  };
}

export async function writeHybridEpisode(
  store: HybridStore,
  input: HybridEpisodeWriteInput,
): Promise<HybridEpisodeWriteResult> {
  const listLimit = Math.max(1, input.limits?.maxListItems ?? DEFAULT_LIST_LIMIT);
  const textLimit = Math.max(32, input.limits?.maxTextLength ?? DEFAULT_TEXT_LIMIT);
  const existingPartner = await store.getPartnerById(input.partner.partner_id);
  const episode = normalizeEpisode(input.partner.partner_id, input.episode, listLimit, textLimit);
  const partner = normalizePartner(input.partner, existingPartner, episode.timestamp, listLimit);

  await store.upsertPartner(partner);
  await store.putEpisode(episode);

  return {
    partner,
    episode,
    partnerCreated: existingPartner === null,
  };
}

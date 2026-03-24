import { join } from "node:path";
import { DATA_DIR } from "../config/dataDir.js";
import type { EngagementCandidate } from "./candidateBoundary.js";
import type { ConversationBundle } from "./conversationBundle.js";
import type { SignalProfile } from "./signalProfile.js";
import {
  createHybridStore,
  type HybridStore,
} from "../memory/hybrid/store.js";
import {
  assembleRetrievalContextPack,
  buildPartnerSnapshot,
} from "../memory/hybrid/readPath.js";
import {
  buildHybridShadowComparisonReport,
  type HybridShadowComparisonReport,
} from "../memory/hybrid/shadowMode.js";
import {
  evaluateHybridShadowReadiness,
  type EvaluateHybridShadowReadinessInput,
  type HybridShadowReadinessResult,
} from "../memory/hybrid/shadowGate.js";
import type { RetrievalContextPack } from "../memory/hybrid/types.js";
import { getGnomesConfig } from "../config/gnomesConfig.js";

export type HybridRuntimeMode = "legacy" | "shadow" | "assist" | "hybrid";

export interface HybridRuntimeThresholds {
  minMatchScore: number;
  maxDiffCount: number;
  allowShadowOnly: boolean;
}

export interface HybridRuntimeLimits {
  maxAtoms: number;
  maxEpisodes: number;
  maxNotes: number;
  maxLoops: number;
  maxReasons: number;
  maxContextChars: number;
}

export interface HybridRuntimeConfig {
  mode: HybridRuntimeMode;
  storePath: string;
  thresholds: HybridRuntimeThresholds;
  limits: HybridRuntimeLimits;
}

export interface PrepareHybridRuntimeConversationBundleInput {
  candidate: EngagementCandidate;
  bundle: ConversationBundle;
  signalProfile: SignalProfile;
  config?: HybridRuntimeConfig;
  store?: HybridStore;
  generatedAt?: string;
}

export interface HybridRuntimeTrace {
  mode: HybridRuntimeMode;
  applied: boolean;
  ready: boolean;
  shadow_status?: HybridShadowComparisonReport["status"];
  match_score?: number;
  diff_count?: number;
  blockers: string[];
  warnings: string[];
  context_chars?: number;
}

export interface PrepareHybridRuntimeConversationBundleResult {
  bundle: ConversationBundle;
  trace: HybridRuntimeTrace;
  comparison?: HybridShadowComparisonReport;
  readiness?: HybridShadowReadinessResult;
}

const DEFAULT_THRESHOLDS: HybridRuntimeThresholds = {
  minMatchScore: 0.7,
  maxDiffCount: 4,
  allowShadowOnly: false,
};

const DEFAULT_LIMITS: HybridRuntimeLimits = {
  maxAtoms: 5,
  maxEpisodes: 5,
  maxNotes: 4,
  maxLoops: 4,
  maxReasons: 4,
  maxContextChars: 720,
};

function normalizeMode(raw: string | undefined): HybridRuntimeMode {
  const mode = raw?.trim().toLowerCase();
  const { LEGACY_COMPAT } = getGnomesConfig();
  if (mode === "shadow" || mode === "assist" || mode === "hybrid") return mode;
  if (mode === "full") return "hybrid";
  return LEGACY_COMPAT ? "legacy" : "hybrid";
}

function parseNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw || !raw.trim()) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function trimText(value: string | undefined, limit = 240): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3))}...` : normalized;
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

function normalizeConversationBundle(
  bundle: ConversationBundle,
  context?: string
): ConversationBundle {
  if (!context) {
    return bundle;
  }

  const nextSourceMetadata = {
    ...(bundle.sourceMetadata ?? {}),
    context,
  };

  return {
    ...bundle,
    sourceMetadata: nextSourceMetadata,
  };
}

function appendBoundedContext(existing: string | undefined, addition: string, maxChars: number): string {
  const base = trimText(existing, maxChars);
  const next = base ? `${base}\n\n${addition}` : addition;
  return trimText(next, maxChars) ?? addition.slice(0, maxChars);
}

function readString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function buildLegacyRuntimeComparisonPack(input: {
  candidate: EngagementCandidate;
  bundle: ConversationBundle;
  signalProfile: SignalProfile;
  generatedAt: string;
  limits: HybridRuntimeLimits;
}): RetrievalContextPack {
  const snapshotSummary = trimText(
    [
      input.bundle.sourceTweet?.normalizedText ?? input.candidate.normalizedText,
      input.signalProfile.reasons?.slice(0, 3).join(" • "),
      input.signalProfile.meta.conversationForm,
    ]
      .filter(Boolean)
      .join(" | "),
    240,
  ) ?? "baseline runtime context";

  const selectedEpisodes = unique(
    [
      input.bundle.sourceTweet?.tweetId,
      input.bundle.parentRef?.tweetId ? `parent:${input.bundle.parentRef.tweetId}` : undefined,
      input.candidate.conversationId ? `conversation:${input.candidate.conversationId}` : undefined,
    ],
    2,
  ).map((episodeId, index) => ({
    episode_id: episodeId,
    excerpt: trimText(
      index === 0
        ? input.bundle.sourceTweet?.normalizedText ?? input.candidate.normalizedText
        : input.bundle.parentRef?.tweetId
          ? `parent reference ${input.bundle.parentRef.tweetId}`
          : input.candidate.conversationId
            ? `conversation ${input.candidate.conversationId}`
            : input.candidate.normalizedText,
      240,
    ) ?? input.candidate.normalizedText,
    reason: index === 0 ? "baseline source text" : "baseline parent context",
    timestamp: input.candidate.discoveredAt,
  }));

  const continuityHooks = unique(
    [
      input.signalProfile.reasons?.[0],
      input.signalProfile.reasons?.[1],
      input.bundle.authorContext?.authorHandle,
      input.bundle.authorContext?.sourceAccount,
    ],
    input.limits.maxNotes,
  );

  const riskNotes = unique(
    [
      input.signalProfile.risk.adversarialConflictRisk === "HIGH" ? "adversarial conflict risk" : undefined,
      input.signalProfile.risk.ragebaitOrMemeRisk === "HIGH" ? "meme or ragebait risk" : undefined,
      input.signalProfile.risk.opportunisticReplyRisk === "HIGH" ? "opportunistic reply risk" : undefined,
      input.signalProfile.risk.pileOnRisk === "HIGH" ? "pile on risk" : undefined,
      input.signalProfile.risk.lowSubstanceRisk === "HIGH" ? "low substance risk" : undefined,
    ],
    input.limits.maxNotes,
  );

  const openLoops = unique(
    [
      input.signalProfile.meta.dialogueState,
      input.signalProfile.meta.conversationForm,
      input.signalProfile.reasons?.find((reason) => reason.includes("dialogue")),
    ],
    input.limits.maxLoops,
  );

  return {
    partner_id: input.candidate.authorId ?? input.bundle.authorContext?.authorId ?? input.candidate.candidateId,
    snapshot: {
      snapshot_id: `baseline:${input.candidate.candidateId}:snapshot`,
      summary: snapshotSummary,
      generated_at: input.generatedAt,
      active_atom_ids: [],
    },
    selected_atoms: [],
    selected_episodes: selectedEpisodes,
    projection: null,
    continuity_hooks: continuityHooks,
    risk_notes: riskNotes,
    open_loops: openLoops,
    retrieval_reasons: unique(
      [
        `baseline:${input.candidate.candidateId}`,
        input.signalProfile.meta.substanceLevel,
        input.signalProfile.meta.authorTypeGuess,
      ],
      input.limits.maxReasons,
    ),
    generated_at: input.generatedAt,
  };
}

async function loadHybridRuntimePack(input: {
  store: HybridStore;
  partnerId: string;
  generatedAt: string;
  limits: HybridRuntimeLimits;
}): Promise<RetrievalContextPack> {
  const [latestSnapshot, atoms, episodes, projections] = await Promise.all([
    input.store.getLatestSnapshotForPartner(input.partnerId),
    input.store.listAtomsForPartner(input.partnerId, { limit: input.limits.maxAtoms }),
    input.store.listEpisodesForPartner(input.partnerId, { limit: input.limits.maxEpisodes }),
    input.store.listProjectionsForPartner(input.partnerId, { limit: 1 }),
  ]);

  const snapshot =
    latestSnapshot ??
    buildPartnerSnapshot({
      partner_id: input.partnerId,
      atoms,
      episodes,
      generated_at: input.generatedAt,
    });

  return assembleRetrievalContextPack({
    partner_id: input.partnerId,
    snapshot,
    atoms,
    episodes,
    projection: projections[0] ?? null,
    generated_at: input.generatedAt,
    limits: {
      maxAtoms: input.limits.maxAtoms,
      maxEpisodes: input.limits.maxEpisodes,
      maxNotes: input.limits.maxNotes,
      maxLoops: input.limits.maxLoops,
      maxReasons: input.limits.maxReasons,
    },
  });
}

function renderHybridRuntimeContext(pack: RetrievalContextPack, maxChars: number): string {
  const lines = [
    "Hybrid memory:",
    `Snapshot: ${pack.snapshot.summary}`,
  ];

  if (pack.projection) {
    lines.push(`Projection: ${pack.projection.summary}`);
  }
  if (pack.selected_atoms.length > 0) {
    lines.push(
      `Atoms: ${pack.selected_atoms
        .slice(0, 3)
        .map((atom) => `${atom.atom_id} — ${atom.summary}`)
        .join(" | ")}`,
    );
  }
  if (pack.selected_episodes.length > 0) {
    lines.push(
      `Episodes: ${pack.selected_episodes
        .slice(0, 3)
        .map((episode) => `${episode.episode_id} — ${episode.reason}: ${episode.excerpt}`)
        .join(" | ")}`,
    );
  }
  if (pack.continuity_hooks.length > 0) {
    lines.push(`Continuity: ${pack.continuity_hooks.join("; ")}`);
  }
  if (pack.risk_notes.length > 0) {
    lines.push(`Risk: ${pack.risk_notes.join("; ")}`);
  }
  if (pack.open_loops.length > 0) {
    lines.push(`Open loops: ${pack.open_loops.join("; ")}`);
  }
  if (pack.retrieval_reasons.length > 0) {
    lines.push(`Reasons: ${pack.retrieval_reasons.join("; ")}`);
  }

  const combined = lines.join("\n");
  return trimText(combined, maxChars) ?? combined.slice(0, maxChars);
}

function buildShadowReadinessInput(params: {
  comparison: HybridShadowComparisonReport;
  thresholds: HybridRuntimeThresholds;
}): EvaluateHybridShadowReadinessInput {
  return {
    report: params.comparison,
    thresholds: {
      min_match_score: params.thresholds.minMatchScore,
      max_diff_count: params.thresholds.maxDiffCount,
      allow_shadow_only: params.thresholds.allowShadowOnly,
    },
  };
}

export function readHybridRuntimeConfig(): HybridRuntimeConfig {
  const mode = normalizeMode(process.env.HYBRID_RUNTIME_MODE);
  const storePath =
    process.env.HYBRID_MEMORY_STORE_PATH?.trim() ||
    process.env.HYBRID_MEMORY_FILE_PATH?.trim() ||
    join(DATA_DIR, "hybrid-memory.json");

  return {
    mode,
    storePath,
    thresholds: {
      minMatchScore: parseNumber(process.env.HYBRID_RUNTIME_MIN_MATCH_SCORE, DEFAULT_THRESHOLDS.minMatchScore, 0, 1),
      maxDiffCount: parseNumber(process.env.HYBRID_RUNTIME_MAX_DIFF_COUNT, DEFAULT_THRESHOLDS.maxDiffCount, 0, 12),
      allowShadowOnly:
        (process.env.HYBRID_RUNTIME_ALLOW_SHADOW_ONLY ?? String(DEFAULT_THRESHOLDS.allowShadowOnly)) === "true",
    },
    limits: {
      maxAtoms: parseNumber(process.env.HYBRID_RUNTIME_MAX_ATOMS, DEFAULT_LIMITS.maxAtoms, 1, 12),
      maxEpisodes: parseNumber(process.env.HYBRID_RUNTIME_MAX_EPISODES, DEFAULT_LIMITS.maxEpisodes, 1, 12),
      maxNotes: parseNumber(process.env.HYBRID_RUNTIME_MAX_NOTES, DEFAULT_LIMITS.maxNotes, 1, 12),
      maxLoops: parseNumber(process.env.HYBRID_RUNTIME_MAX_LOOPS, DEFAULT_LIMITS.maxLoops, 1, 12),
      maxReasons: parseNumber(process.env.HYBRID_RUNTIME_MAX_REASONS, DEFAULT_LIMITS.maxReasons, 1, 12),
      maxContextChars: parseNumber(
        process.env.HYBRID_RUNTIME_MAX_CONTEXT_CHARS,
        DEFAULT_LIMITS.maxContextChars,
        120,
        2000,
      ),
    },
  };
}

export async function prepareHybridRuntimeConversationBundle(
  input: PrepareHybridRuntimeConversationBundleInput
): Promise<PrepareHybridRuntimeConversationBundleResult> {
  const config = input.config ?? readHybridRuntimeConfig();
  const { LEGACY_COMPAT } = getGnomesConfig();
  const effectiveMode: HybridRuntimeMode =
    config.mode === "legacy" && !LEGACY_COMPAT ? "hybrid" : config.mode;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baseBundle = input.bundle;

  if (effectiveMode === "legacy") {
    return {
      bundle: baseBundle,
      trace: {
        mode: effectiveMode,
        applied: false,
        ready: false,
        blockers: [],
        warnings: [],
      },
    };
  }

  const partnerId =
    input.candidate.authorId ??
    input.bundle.authorContext?.authorId ??
    input.bundle.sourceTweet?.authorId ??
    input.candidate.candidateId;
  const store =
    input.store ??
    createHybridStore({
      filePath: config.storePath,
    });

  const hybridPack = await loadHybridRuntimePack({
    store,
    partnerId,
    generatedAt,
    limits: config.limits,
  });
  const legacyPack = buildLegacyRuntimeComparisonPack({
    candidate: input.candidate,
    bundle: input.bundle,
    signalProfile: input.signalProfile,
    generatedAt,
    limits: config.limits,
  });

  const comparison = buildHybridShadowComparisonReport({
    baseline: legacyPack,
    candidate: hybridPack,
    generated_at: generatedAt,
    limits: {
      maxDiffs: config.thresholds.maxDiffCount,
      maxNotes: config.limits.maxNotes,
      maxItems: Math.max(config.limits.maxAtoms, config.limits.maxEpisodes),
    },
  });

  const readiness = evaluateHybridShadowReadiness(
    buildShadowReadinessInput({
      comparison,
      thresholds: config.thresholds,
    }),
  );

  const trace: HybridRuntimeTrace = {
    mode: effectiveMode,
    applied: false,
    ready: readiness.ready,
    shadow_status: comparison.status,
    match_score: comparison.match_score,
    diff_count: comparison.diffs.length,
    blockers: readiness.blockers.slice(0, config.limits.maxReasons),
    warnings: readiness.warnings.slice(0, config.limits.maxReasons),
  };

  const canApply =
    effectiveMode === "assist"
      ? readiness.ready
      : effectiveMode === "hybrid"
        ? readiness.ready && comparison.status === "match"
        : false;

  if (!canApply) {
    return {
      bundle: baseBundle,
      trace,
      comparison,
      readiness,
    };
  }

  const runtimeContext = renderHybridRuntimeContext(hybridPack, config.limits.maxContextChars);
  const existingContext = readString(baseBundle.sourceMetadata, "context");
  const mergedContext = appendBoundedContext(existingContext, runtimeContext, config.limits.maxContextChars);

  trace.applied = true;
  trace.context_chars = mergedContext.length;

  return {
    bundle: normalizeConversationBundle(baseBundle, mergedContext),
    trace,
    comparison,
    readiness,
  };
}

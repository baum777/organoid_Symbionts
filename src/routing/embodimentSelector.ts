/**
 * Embodiment Selector — deterministic selection for organoid interaction identities.
 */

import { getEmbodiment, getAllEmbodiments, getFallbackChain } from "../embodiments/registry.js";
import type { EmbodimentProfile } from "../embodiments/types.js";
import type { SelectorFeatures } from "./selectorFeatures.js";
import type { CanonicalMode } from "../canonical/types.js";
import { selectCameos } from "../swarm/cameoSelector.js";

export interface EmbodimentSelectionCandidate {
  embodimentId: string;
  score: number;
  ruleBasedScore?: number;
  semanticFitScore?: number;
  continuityScore?: number;
  finalSelectionScore?: number;
}

export interface EmbodimentSelectionResult {
  selectedEmbodimentId: string;
  score: number;
  reasoning: string[];
  alternativeCandidates: EmbodimentSelectionCandidate[];
  responseMode: CanonicalMode;
  ruleBasedScore?: number;
  semanticFitScore?: number;
  continuityScore?: number;
  finalSelectionScore?: number;
  explainability?: { anchors: string[]; boundaries: string[]; reasons: string[] };
  continuitySource?: string;
  /** Phase-2: optional cameo candidates for future swarm */
  cameoCandidates?: string[];
}

const CONFIDENCE_THRESHOLD = 0.5;
const ENERGY_HINT_MAP: Record<SelectorFeatures["marketEnergy"], "low" | "mid" | "high"> = {
  LOW: "low",
  MEDIUM: "mid",
  HIGH: "high",
  EXTREME: "high",
};

/** Score a embodiment for this interaction (deterministic). */
function scoreEmbodiment(profile: EmbodimentProfile, features: SelectorFeatures, affinity: number, responseMode?: CanonicalMode): number {
  let score = 0.5;

  const preferred = profile.routing_hints?.preferred_intents ?? [];
  if (preferred.length && (preferred.includes(features.intent) || (responseMode ? preferred.includes(responseMode) : false))) score += 0.25;
  else if (profile.archetype === "chaos_roaster" && ["hype_claim", "launch_announcement", "meme_only"].includes(features.intent)) score += 0.2;
  else if (profile.archetype === "dry_observer" && ["question", "embodiment_query", "lore_query"].includes(features.intent)) score += 0.2;

  const aggrRange = profile.routing_hints?.aggression_range;
  if (aggrRange) {
    const [lo, hi] = aggrRange;
    if (features.aggressionScore >= lo && features.aggressionScore <= hi) score += 0.15;
  }

  score += Math.min(affinity * 0.2, 0.2);

  const preferredEnergy = profile.routing_hints?.preferred_energy ?? [];
  const normalizedEnergy = ENERGY_HINT_MAP[features.marketEnergy];
  if (preferredEnergy.includes(normalizedEnergy)) score += 0.12;

  const absurdityThreshold = profile.routing_hints?.absurdity_threshold;
  if (typeof absurdityThreshold === "number" && features.absurdityScore >= absurdityThreshold) score += 0.08;

  if (features.absurdityScore > 0.6 && ["chaos_roaster", "chaotic_reactor"].includes(profile.archetype)) score += 0.1;

  return Math.min(score, 1);
}

export function computeRuleBasedScores(
  features: SelectorFeatures,
  userAffinityByEmbodiment: Record<string, number> = {},
  responseMode?: CanonicalMode,
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const embodiment of getAllEmbodiments()) {
    scores[embodiment.id] = scoreEmbodiment(embodiment, features, userAffinityByEmbodiment[embodiment.id] ?? 0, responseMode);
  }
  return scores;
}

/**
 * Select embodiment for this interaction.
 * Phase-2: Scoring with affinity; safe fallback when confidence low.
 */
export function selectEmbodiment(
  features: SelectorFeatures,
  responseMode: CanonicalMode,
  opts?: {
    defaultSafeEmbodiment?: string;
    enabled?: boolean;
    userAffinityByEmbodiment?: Record<string, number>;
    semanticFitByEmbodiment?: Record<string, number>;
    semanticExplainByEmbodiment?: Record<string, { anchors: string[]; boundaries: string[]; reasons: string[] }>;
    continuityBonusByEmbodiment?: Record<string, number>;
    swarmEnabled?: boolean;
    maxCameos?: number;
  },
): EmbodimentSelectionResult {
  const defaultEmbodiment = opts?.defaultSafeEmbodiment ?? "stillhalter";
  const enabled = opts?.enabled ?? false;
  const affinityMap = opts?.userAffinityByEmbodiment ?? {};
  const semanticMap = opts?.semanticFitByEmbodiment ?? {};
  const continuityMap = opts?.continuityBonusByEmbodiment ?? {};

  const all = getAllEmbodiments();
  if (!enabled || all.length === 0) {
    return {
      selectedEmbodimentId: defaultEmbodiment,
      score: 1,
      reasoning: ["embodiments_disabled_or_empty"],
      alternativeCandidates: [],
      responseMode,
    };
  }

  const fallbackChain = getFallbackChain();

  const scored: EmbodimentSelectionCandidate[] = all
    .map((p) => {
      const ruleBasedScore = scoreEmbodiment(p, features, affinityMap[p.id] ?? 0, responseMode);
      const semanticFitScore = semanticMap[p.id] ?? 0;
      const continuityScore = continuityMap[p.id] ?? 0;
      const finalSelectionScore = Math.min(1, ruleBasedScore * 0.65 + semanticFitScore * 0.3 + continuityScore);
      return {
        embodimentId: p.id,
        score: finalSelectionScore,
        ruleBasedScore,
        semanticFitScore,
        continuityScore,
        finalSelectionScore,
      };
    })
    .sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) return a.embodimentId.localeCompare(b.embodimentId);
      return b.score - a.score;
    });

  const best = scored[0];
  const confidenceLow = features.confidenceScore < CONFIDENCE_THRESHOLD;

  let selectedId: string;
  const reasoning: string[] = [];

  if (confidenceLow && fallbackChain.length > 0) {
    selectedId = fallbackChain[0] ?? defaultEmbodiment;
    reasoning.push("low_confidence_safe_fallback");
  } else if (best && best.score >= 0.5) {
    selectedId = best.embodimentId;
    reasoning.push(`scored_${best.score.toFixed(2)}`);
  } else {
    selectedId = fallbackChain[0] ?? defaultEmbodiment;
    reasoning.push("fallback_chain");
  }

  if (["hard_caution", "neutral_clarification"].includes(responseMode) && selectedId === "nebelspieler") {
    const override = getEmbodiment("stillhalter") ?? getEmbodiment("wurzelwaechter");
    if (override) {
      selectedId = override.id;
      reasoning.push("dominance_override_nebelspieler_caution_mode");
    }
  }

  const alternatives = scored.filter((c) => c.embodimentId !== selectedId).slice(0, 3);

  let cameoCandidates: string[] | undefined;
  if (opts?.swarmEnabled && opts?.maxCameos && opts.maxCameos > 0) {
    const conversationEnergy = features.relevanceScore * (features.absurdityScore > 0.5 ? 1.2 : 1);
    cameoCandidates = selectCameos(
      {
        primaryEmbodimentId: selectedId,
        conversationEnergy: Math.min(1, conversationEnergy),
        absurdityScore: features.absurdityScore,
        availableEmbodiments: all.map((p) => p.id),
      },
      { maxCameos: opts.maxCameos, energyThreshold: 0.65 },
    );
    if (cameoCandidates.length > 0) reasoning.push("swarm_cameos");
  }

  const selected = scored.find((c) => c.embodimentId === selectedId);

  return {
    selectedEmbodimentId: selectedId,
    score: selected?.score ?? best?.score ?? 1,
    reasoning,
    alternativeCandidates: alternatives,
    responseMode,
    ruleBasedScore: selected?.ruleBasedScore,
    semanticFitScore: selected?.semanticFitScore,
    continuityScore: selected?.continuityScore,
    finalSelectionScore: selected?.finalSelectionScore,
    explainability: opts?.semanticExplainByEmbodiment?.[selectedId] ?? { anchors: [], boundaries: [], reasons: [] },
    cameoCandidates,
  };
}


import type { EmbodimentProfile } from "../../embodiments/types.js";
import type { EmbodimentEpisode, EmbodimentReflection } from "../memoryTypes.js";
import type { EmbodimentSemanticRecord } from "../types.js";

function containsAny(text: string, needles: string[]): boolean {
  const low = text.toLowerCase();
  return needles.some((n) => low.includes(n.toLowerCase()));
}

export function scoreInEmbodiment(episode: EmbodimentEpisode, profile: EmbodimentProfile): number {
  const facets = profile.semantic_facets ?? [];
  const style = profile.style_anchors ?? [];
  const candidate = `${episode.interactionText} ${episode.responseText}`;
  const facetHit = facets.length
    ? facets.filter((f) => containsAny(candidate, f.split(/[^a-zA-Z0-9]+/).filter((t) => t.length > 3))).length / facets.length
    : 0.5;
  const styleHit = style.length
    ? style.filter((s) => containsAny(candidate, s.split(/[^a-zA-Z0-9]+/).filter((t) => t.length > 3))).length / style.length
    : 0.5;
  return Math.min(1, 0.6 * facetHit + 0.4 * styleHit);
}

export function scoreUtility(episode: EmbodimentEpisode): number {
  let score = 0.35;
  if ((episode.responseText ?? "").length > 40) score += 0.2;
  if (episode.qualitySignals?.accepted) score += 0.2;
  if (episode.qualitySignals?.useful) score += 0.2;
  if ((episode.topicTags ?? []).length > 0) score += 0.05;
  return Math.min(1, score);
}

export function scoreDriftRisk(episode: EmbodimentEpisode, profile: EmbodimentProfile): number {
  const negativeAnchors = profile.negative_anchors ?? [];
  const boundaries = profile.safety_boundaries ?? [];
  const combined = [...negativeAnchors, ...boundaries];
  const response = episode.responseText ?? "";
  const boundaryViolation = combined.length ? combined.filter((b) => containsAny(response, [b])).length / combined.length : 0;
  const signalRisk = episode.qualitySignals?.driftRisk ?? 0.2;
  return Math.min(1, signalRisk + boundaryViolation * 0.6);
}

export function shouldRetainEpisode(reflection: Pick<EmbodimentReflection, "inEmbodimentScore" | "utilityScore" | "driftRisk">): boolean {
  return reflection.inEmbodimentScore >= 0.6 && reflection.utilityScore >= 0.55 && reflection.driftRisk <= 0.45;
}

export function shouldPromoteToSemanticRecord(reflection: Pick<EmbodimentReflection, "inEmbodimentScore" | "utilityScore" | "driftRisk">): boolean {
  return reflection.inEmbodimentScore >= 0.8 && reflection.utilityScore >= 0.7 && reflection.driftRisk <= 0.25;
}

export function reflectEpisode(episode: EmbodimentEpisode, profile: EmbodimentProfile): EmbodimentReflection {
  const inEmbodimentScore = scoreInEmbodiment(episode, profile);
  const utilityScore = scoreUtility(episode);
  const driftRisk = scoreDriftRisk(episode, profile);
  const qualityScore = Math.max(0, inEmbodimentScore * 0.5 + utilityScore * 0.35 + (1 - driftRisk) * 0.15);
  const retain = shouldRetainEpisode({ inEmbodimentScore, utilityScore, driftRisk });
  const promote = shouldPromoteToSemanticRecord({ inEmbodimentScore, utilityScore, driftRisk });

  return {
    episodeId: episode.id,
    embodimentId: episode.embodimentId,
    qualityScore,
    inEmbodimentScore,
    utilityScore,
    driftRisk,
    retentionDecision: retain ? "retain" : "discard",
    promotionState: promote ? "promoted" : "rejected",
    reasoning: [`inEmbodiment=${inEmbodimentScore.toFixed(2)}`, `utility=${utilityScore.toFixed(2)}`, `drift=${driftRisk.toFixed(2)}`],
    createdAt: new Date().toISOString(),
  };
}

export function promoteEpisodeToSemanticRecord(
  episode: EmbodimentEpisode,
  reflection: EmbodimentReflection,
  profile: EmbodimentProfile,
  version = "v1",
): EmbodimentSemanticRecord | null {
  if (reflection.promotionState !== "promoted") return null;
  return {
    id: `reflection:${episode.embodimentId}:${episode.id}`,
    embodimentId: episode.embodimentId,
    namespace: "memory-episodic",
    docType: "embodiment_example",
    text: episode.responseText,
    metadata: {
      role: profile.role,
      archetype: profile.archetype,
      sourceType: "reflection",
      active: true,
      version,
      derivedFrom: episode.id,
      exampleQuality: "silver",
      retrievalPriority: profile.retrieval_priority,
    },
  };
}

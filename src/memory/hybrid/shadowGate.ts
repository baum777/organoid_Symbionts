import type { HybridShadowComparisonReport, HybridShadowComparisonStatus } from "./shadowMode.js";

const DEFAULT_MIN_MATCH_SCORE = 0.92;
const DEFAULT_MAX_DIFF_COUNT = 0;

export interface HybridShadowReadinessThresholds {
  min_match_score?: number;
  max_diff_count?: number;
  allow_shadow_only?: boolean;
}

export interface EvaluateHybridShadowReadinessInput {
  report: HybridShadowComparisonReport;
  thresholds?: HybridShadowReadinessThresholds;
}

export interface HybridShadowReadinessResult {
  ready: boolean;
  comparison_status: HybridShadowComparisonStatus;
  match_score: number;
  diff_count: number;
  blockers: string[];
  warnings: string[];
}

function clampThreshold(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function clampDiffCount(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(12, Math.floor(value)));
}

export function evaluateHybridShadowReadiness(input: EvaluateHybridShadowReadinessInput): HybridShadowReadinessResult {
  const minMatchScore = clampThreshold(input.thresholds?.min_match_score, DEFAULT_MIN_MATCH_SCORE);
  const maxDiffCount = clampDiffCount(input.thresholds?.max_diff_count, DEFAULT_MAX_DIFF_COUNT);
  const allowShadowOnly = input.thresholds?.allow_shadow_only ?? false;
  const diffCount = input.report.diffs.length;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (input.report.status === "shadow_only") {
    if (!allowShadowOnly) {
      blockers.push("baseline comparison unavailable");
    } else {
      warnings.push("shadow-only comparison accepted for inspection");
    }
  }

  if (input.report.status === "divergent") {
    blockers.push("shadow comparison diverged");
  }

  if (input.report.match_score < minMatchScore) {
    blockers.push(`match score below threshold (${input.report.match_score.toFixed(4)} < ${minMatchScore.toFixed(4)})`);
  }

  if (diffCount > maxDiffCount) {
    blockers.push(`diff count above threshold (${diffCount} > ${maxDiffCount})`);
  }

  if (input.report.status === "match" && diffCount === 0) {
    warnings.push("shadow comparison aligned");
  }

  return {
    ready: blockers.length === 0,
    comparison_status: input.report.status,
    match_score: input.report.match_score,
    diff_count: diffCount,
    blockers,
    warnings,
  };
}

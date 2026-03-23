import type { HybridShadowComparisonReport, HybridShadowComparisonStatus } from "../memory/hybrid/shadowMode.js";
import type { ContextBundle } from "./types.js";

export interface HybridTraceSignals {
  shadow_status: HybridShadowComparisonStatus;
  shadow_comparison?: HybridShadowComparisonReport | null;
}

export interface AttachHybridShadowSignalsInput {
  trace: ContextBundle["trace"];
  comparison?: HybridShadowComparisonReport | null;
}

export function attachHybridShadowSignals(input: AttachHybridShadowSignalsInput): ContextBundle["trace"] {
  if (!input.comparison) {
    return input.trace;
  }

  const nextHybrid: HybridTraceSignals = {
    shadow_status: input.comparison.status,
    shadow_comparison: input.comparison,
  };

  return {
    ...input.trace,
    hybrid: {
      ...input.trace.hybrid,
      ...nextHybrid,
    },
  };
}

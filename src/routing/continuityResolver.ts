/**
 * Continuity Resolver — Preserve embodiment continuity within threads
 *
 * When EMBODIMENTS_ENABLED and EMBODIMENT_CONTINUITY_ENABLED are true, prefers to keep
 * the same embodiment within a conversation thread to avoid embodiment flipping.
 * Overrides when thread tone strongly shifts.
 */

export interface ContinuityContext {
  threadId: string;
  priorEmbodimentId?: string;
  priorResponseMode?: string;
  messageCountInThread?: number;
}

export interface ContinuityResult {
  /** Embodiment ID to use (may override selector when continuity applies) */
  embodimentId: string;
  /** Whether continuity was applied */
  applied: boolean;
  /** Reason for decision */
  reason: string;
}

/**
 * Resolve embodiment continuity. If we have a prior embodiment in this thread and
 * we're early in the conversation, prefer to keep the same embodiment.
 * Phase-1: Simple pass-through; Phase-2 will add thread lookup.
 */
export function resolveContinuity(
  selectedEmbodimentId: string,
  context: ContinuityContext,
  opts?: { continuityEnabled?: boolean },
): ContinuityResult {
  const enabled = opts?.continuityEnabled ?? false;

  if (!enabled || !context.priorEmbodimentId) {
    return {
      embodimentId: selectedEmbodimentId,
      applied: false,
      reason: enabled ? "no_prior_embodiment" : "continuity_disabled",
    };
  }

  const msgCount = context.messageCountInThread ?? 0;
  if (msgCount > 5) {
    return {
      embodimentId: selectedEmbodimentId,
      applied: false,
      reason: "thread_long_enough_to_switch",
    };
  }

  return {
    embodimentId: context.priorEmbodimentId,
    applied: true,
    reason: "continuity_preserved",
  };
}

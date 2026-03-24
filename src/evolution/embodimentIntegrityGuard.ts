/**
 * Embodiment Integrity Guard — Prevent identity drift
 *
 * Phase-3: Detects excessive embodimentlity drift, rejects unsafe evolution.
 */

export interface IntegrityCheckResult {
  allowed: boolean;
  reason?: string;
}

/** Reject evolution signals that would violate embodiment integrity. */
export function checkEmbodimentIntegrity(
  signals: Array<{ trait_key: string; direction: string; magnitude: number }>,
  _embodimentId: string,
): IntegrityCheckResult {
  for (const s of signals) {
    if (s.magnitude > 0.5) return { allowed: false, reason: "magnitude_too_high" };
    if (["aggression", "hostility"].includes(s.trait_key))
      return { allowed: false, reason: "taboo_trait" };
  }
  return { allowed: true };
}

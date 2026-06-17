// Server-side constants for the /api/consult runner.
// Kept separate from the client-side constants in
// lib/consult/constants.ts so the server can enforce a
// larger cap (4000 chars) than the client UI (800 chars).

export const SERVER_SIGNAL_MAX = 4000;
export const SERVER_SIGNAL_MIN = 4;

// Soft target / hard max for the lead voice, in characters.
// Aligned with the canonical `embodiment_reply` mode budget
// (see src/canonical/modeBudgets.ts).
export const LEAD_SOFT_TARGET = 200;
export const LEAD_HARD_MAX = 320;

// Confidence floor for the lead voice. Below this the
// runner returns a stabilisation answer instead of a
// full embodiment reply. Sourced from
// docs/methodology/coaching-contexts.md § 10 (open
// question on floor relaxation: keep 0.3 for life/
// reflection, 0.2 for creative in MVP).
export const CONFIDENCE_FLOOR: Record<string, number> = {
  life: 0.3,
  reflection: 0.3,
  creative: 0.2,
};

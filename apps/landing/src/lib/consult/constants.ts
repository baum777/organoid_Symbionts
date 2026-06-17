// Type definitions and constants for the /consult client surface.
// Kept in lib/consult/ so they are importable from the page, the
// subcomponents, and (in Week 3) the future /api/consult route handler.

export type ConsultContext = "life" | "reflection" | "creative";
export type ConsultPosture = "sachlich" | "empathisch" | "konfrontativ";
export type ConsultLocale = "de" | "en";
export type ConsultStatus = "idle" | "loading" | "success" | "error";

export type ConsultContextOption = {
  id: ConsultContext;
  label: string;
  body: string;
  toneClass: string;
};

export type ConsultPostureOption = {
  id: ConsultPosture;
  label: string;
};

export const CONTEXT_OPTIONS: ReadonlyArray<ConsultContextOption> = [
  {
    id: "life",
    label: "Life",
    body: "Open life questions, decisions, transitions.",
    toneClass: "border-bio/40 bg-bio/8 text-ink",
  },
  {
    id: "reflection",
    label: "Reflection",
    body: "Identity, family patterns, inner-critic work.",
    toneClass: "border-ink/30 bg-white/5 text-ink",
  },
  {
    id: "creative",
    label: "Creative",
    body: "Writing, art, stuck scenes, style questions.",
    toneClass: "border-signal/40 bg-signal/8 text-ink",
  },
];

export const POSTURE_OPTIONS: ReadonlyArray<ConsultPostureOption> = [
  { id: "sachlich", label: "Sachlich" },
  { id: "empathisch", label: "Empathisch" },
  { id: "konfrontativ", label: "Konfrontativ" },
];

export const PLACEHOLDER_BY_CONTEXT: Record<ConsultContext, string> = {
  life: "Was steht gerade an?",
  reflection: "Was möchtest du heute reflektieren?",
  creative: "Woran arbeitest du?",
};

// 7 canonical embodiment glyphs, used for the post-submit pulse and for
// any future visualisation that wants to render the full matrix.
export const GLYPH_PULSE: readonly string[] = ["◇", "┴", "╬", "◉", "〰", "◆", "■"];

// Client-side hard cap on the signal textarea length. The /api/consult
// route handler in Week 3 will enforce the same cap server-side.
export const SIGNAL_MAX = 800;

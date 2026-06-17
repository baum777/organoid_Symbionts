import { practice } from "@/lib/content";

// Stub answer for the Week 2 UI-skeleton. The real /api/consult endpoint
// replaces this in Week 3. Derived from the canonical practice.embodiments
// registry (not hardcoded) so changes to the embodiment data flow through
// automatically. The three voices are horizon-drifter (lead),
// root-sentinel (counterweight), and stabil-core (anchor) — the same
// triadic voice structure that /api/consult will return in Week 3.
function lookupVoice(id: string) {
  const entry = practice.embodiments.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Consult stub answer references missing embodiment: ${id}`);
  }
  return {
    id: entry.id,
    glyph: entry.glyph,
    name: entry.name,
    classical: entry.classical,
    answer: entry.sampleQuote,
  };
}

export const STUB_ANSWER = {
  requestId: "01HXYZ-STUB-WEEK-2",
  phase: "Swarm Coherence",
  phaseConfidence: 0.78,
  lead: lookupVoice("horizon-drifter"),
  counterweight: lookupVoice("root-sentinel"),
  anchor: lookupVoice("stabil-core"),
} as const;

type AnswerCardProps = {
  glyph: string;
  name: string;
  classical: string;
  answer: string;
  label: string;
};

function AnswerCard({ glyph, name, classical, answer, label }: AnswerCardProps) {
  return (
    <article className="glass-card relative overflow-hidden p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
        {label}
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span
          role="img"
          aria-label={`Glyph: ${name}`}
          className="font-display text-4xl text-ink"
        >
          {glyph}
        </span>
        <div className="space-y-2">
          <h3 className="font-display text-xl uppercase tracking-[-0.03em] text-ink">
            {name}
          </h3>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-400">
            {classical}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-200 sm:text-base">{answer}</p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        → /api/connect (coming week 3)
      </p>
    </article>
  );
}

type StubAnswerProps = {
  onReset: () => void;
};

export function StubAnswer({ onReset }: StubAnswerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-anomaly/30 bg-anomaly/8 p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-anomaly">
          UI demo · hardcoded answers
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          The real /api/consult endpoint is wired in Week 3. Until then, every
          answer below is a static demo with three voices from the practice
          matrix.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
          request · {STUB_ANSWER.requestId} · phase {STUB_ANSWER.phase} ·{" "}
          {(STUB_ANSWER.phaseConfidence * 100).toFixed(0)}% confidence
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          Ask another
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AnswerCard
          label="Lead"
          glyph={STUB_ANSWER.lead.glyph}
          name={STUB_ANSWER.lead.name}
          classical={STUB_ANSWER.lead.classical}
          answer={STUB_ANSWER.lead.answer}
        />
        <AnswerCard
          label="Counterweight"
          glyph={STUB_ANSWER.counterweight.glyph}
          name={STUB_ANSWER.counterweight.name}
          classical={STUB_ANSWER.counterweight.classical}
          answer={STUB_ANSWER.counterweight.answer}
        />
        <AnswerCard
          label="Anchor"
          glyph={STUB_ANSWER.anchor.glyph}
          name={STUB_ANSWER.anchor.name}
          classical={STUB_ANSWER.anchor.classical}
          answer={STUB_ANSWER.anchor.answer}
        />
      </div>
    </div>
  );
}

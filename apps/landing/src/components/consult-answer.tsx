import type { ConsultResponse } from "@/lib/consult/types";

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
    </article>
  );
}

type ConsultAnswerProps = {
  response: ConsultResponse;
  onReset: () => void;
};

export function ConsultAnswer({ response, onReset }: ConsultAnswerProps) {
  const cards: Array<{ key: string; label: string; voice: typeof response.lead }> = [];
  cards.push({ key: "lead", label: "Lead", voice: response.lead });
  if (response.counterweight) {
    cards.push({
      key: "counterweight",
      label: "Counterweight",
      voice: response.counterweight,
    });
  }
  if (response.anchor) {
    cards.push({ key: "anchor", label: "Anchor", voice: response.anchor });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
          request · {response.requestId} · phase {response.phase} ·{" "}
          {(response.phaseConfidence * 100).toFixed(0)}% confidence
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
        {cards.map((card) => (
          <AnswerCard
            key={card.key}
            label={card.label}
            glyph={card.voice.glyph}
            name={card.voice.name}
            classical={card.voice.classical}
            answer={card.voice.answer}
          />
        ))}
      </div>
    </div>
  );
}

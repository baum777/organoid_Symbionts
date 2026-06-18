import type { ConsultResponse } from "@/lib/consult/types";

type AnswerCardProps = {
  glyph: string;
  name: string;
  classical: string;
  answer: string;
  label: string;
  role: "lead" | "counter" | "anchor";
};

function AnswerCard({ glyph, name, classical, answer, label, role }: AnswerCardProps) {
  return (
    <article
      className="voice-card relative overflow-hidden backdrop-blur-xl shadow-[0_16px_60px_rgba(0,0,0,0.24)]"
      data-role={role}
    >
      <p className="label-caps">{label}</p>
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
          <p className="label-meta">{classical}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-body sm:text-base">{answer}</p>
    </article>
  );
}

type ConsultAnswerProps = {
  response: ConsultResponse;
  onReset: () => void;
};

export function ConsultAnswer({ response, onReset }: ConsultAnswerProps) {
  const cards: Array<{
    key: string;
    label: string;
    role: "lead" | "counter" | "anchor";
    voice: typeof response.lead;
  }> = [];
  cards.push({ key: "lead", label: "Lead", role: "lead", voice: response.lead });
  if (response.counterweight) {
    cards.push({ key: "counterweight", label: "Counterweight", role: "counter", voice: response.counterweight });
  }
  if (response.anchor) {
    cards.push({ key: "anchor", label: "Anchor", role: "anchor", voice: response.anchor });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-caps">
          request · {response.requestId} · phase {response.phase} ·{" "}
          {(response.phaseConfidence * 100).toFixed(0)}% confidence
        </p>
        <button type="button" onClick={onReset} className="btn-ghost min-h-[44px]">
          Ask another
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <AnswerCard
            key={card.key}
            label={card.label}
            role={card.role}
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

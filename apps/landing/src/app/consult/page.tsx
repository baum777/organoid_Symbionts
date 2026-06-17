"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { PracticeNav } from "@/components/practice-nav";
import { PracticeCompliance } from "@/components/practice-compliance";
import { FooterManifest } from "@/components/footer-manifest";

// --- Static wiring ----------------------------------------------------

type ConsultContext = "life" | "reflection" | "creative";
type ConsultPosture = "sachlich" | "empathisch" | "konfrontativ";

const CONTEXT_OPTIONS: ReadonlyArray<{
  id: ConsultContext;
  label: string;
  body: string;
  toneClass: string;
}> = [
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

const POSTURE_OPTIONS: ReadonlyArray<{
  id: ConsultPosture;
  label: string;
}> = [
  { id: "sachlich", label: "Sachlich" },
  { id: "empathisch", label: "Empathisch" },
  { id: "konfrontativ", label: "Konfrontativ" },
];

const PLACEHOLDER_BY_CONTEXT: Record<ConsultContext, string> = {
  life: "Was steht gerade an?",
  reflection: "Was möchtest du heute reflektieren?",
  creative: "Woran arbeitest du?",
};

const GLYPH_PULSE: readonly string[] = ["◇", "┴", "╬", "◉", "〰", "◆", "■"];

const SIGNAL_MAX = 800;

// Hardcoded stub for the Week 2 UI-skeleton. The real /api/consult
// endpoint replaces this in Week 3.
const STUB_ANSWER = {
  requestId: "01HXYZ-STUB-WEEK-2",
  phase: "Swarm Coherence",
  phaseConfidence: 0.78,
  lead: {
    id: "horizon-drifter",
    glyph: "◇",
    name: "Horizon-Drifter",
    classical: "Nebelspieler",
    answer:
      "Du stehst an einer Schwelle. Die Frage ist nicht 'wann', sondern 'wer gehst du durch die Tuer'.",
  },
  counterweight: {
    id: "root-sentinel",
    glyph: "┴",
    name: "Root-Sentinel",
    classical: "Wurzelwaechter",
    answer:
      "Bevor du gehst: was bindet dich hier, das du nicht benennen willst?",
  },
  anchor: {
    id: "stabil-core",
    glyph: "■",
    name: "Stabil-Core",
    classical: "Stillhalter",
    answer: "Was bleibt in dir gleich, egal wo du bist?",
  },
} as const;

// --- Subcomponents (inlined per Week 2 spec — see planning doc § 5) ---

function ConsultHeader() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/practice"
        className="self-start rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:bg-white/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        ← Back to /practice
      </Link>
      <span className="chip self-start">
        reflection companion · API wiring in week 3
      </span>
      <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
        Try the matrix
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
        One question. One answer from the lead voice. The counterweight and
        anchor come along for the ride. Nothing here is a clinical read —
        this is a reflection companion.
      </p>
    </div>
  );
}

function ContextSelector({
  value,
  onChange,
}: {
  value: ConsultContext;
  onChange: (next: ConsultContext) => void;
}) {
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby="consult-context-label"
      className="flex flex-col gap-3"
    >
      <legend
        id="consult-context-label"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        Context
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {CONTEXT_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <div
              key={option.id}
              role="radio"
              tabIndex={selected ? 0 : -1}
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => onChange(option.id)}
              onKeyDown={(event) => handleRadioKey(event, value, option.id, onChange)}
              className={[
                "glass-card flex min-h-[44px] cursor-pointer flex-col gap-1 p-4 text-left transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                option.toneClass,
                selected ? "border-white/30 ring-1 ring-white/20" : "border-white/10 opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <span className="font-display text-base uppercase tracking-[-0.02em]">
                {option.label}
              </span>
              <span className="text-xs leading-5 text-zinc-300">{option.body}</span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function PostureSelector({
  value,
  onChange,
}: {
  value: ConsultPosture;
  onChange: (next: ConsultPosture) => void;
}) {
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby="consult-posture-label"
      className="flex flex-col gap-3"
    >
      <legend
        id="consult-posture-label"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        Posture
      </legend>
      <div className="flex flex-wrap gap-2">
        {POSTURE_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.id)}
              onKeyDown={(event) => handleRadioKey(event, value, option.id, onChange)}
              className={[
                "inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                selected
                  ? "border-anomaly/40 bg-anomaly/14 text-anomaly"
                  : "border-white/12 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Roving-tabindex + arrow-key handler for the WAI-ARIA radio groups above.
function handleRadioKey<T extends string>(
  event: KeyboardEvent<HTMLElement>,
  current: T,
  target: T,
  onChange: (next: T) => void,
) {
  const order: readonly T[] = (event.currentTarget.parentElement
    ? Array.from(event.currentTarget.parentElement.querySelectorAll<HTMLElement>("[role=radio]"))
    : []
  ).map((el) => el.getAttribute("aria-label") as T);

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    onChange(target);
    return;
  }
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length] ?? target;
    onChange(next);
    (event.currentTarget.parentElement?.querySelector<HTMLElement>(
      `[role=radio][aria-label="${next}"]`,
    ))?.focus();
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const idx = order.indexOf(current);
    const next = order[(idx - 1 + order.length) % order.length] ?? target;
    onChange(next);
    (event.currentTarget.parentElement?.querySelector<HTMLElement>(
      `[role=radio][aria-label="${next}"]`,
    ))?.focus();
  }
}

function ConsultInput({
  value,
  onChange,
  context,
}: {
  value: string;
  onChange: (next: string) => void;
  context: ConsultContext;
}) {
  const remaining = SIGNAL_MAX - value.length;
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="consult-signal"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        Your question
      </label>
      <textarea
        id="consult-signal"
        name="signal"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, SIGNAL_MAX))}
        placeholder={PLACEHOLDER_BY_CONTEXT[context]}
        rows={5}
        maxLength={SIGNAL_MAX}
        required
        aria-required="true"
        aria-describedby="consult-counter consult-help"
        className="glass-card min-h-[44px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      />
      <div className="flex items-center justify-between gap-3">
        <p id="consult-help" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
          Max 800 characters
        </p>
        <p
          id="consult-counter"
          aria-live="polite"
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300"
        >
          {remaining} characters left
        </p>
      </div>
    </div>
  );
}

function AnswerCard({
  glyph,
  name,
  classical,
  answer,
  label,
}: {
  glyph: string;
  name: string;
  classical: string;
  answer: string;
  label: string;
}) {
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

function StubAnswer({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col gap-5">
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

// --- Page -------------------------------------------------------------

export default function ConsultPage() {
  const [context, setContext] = useState<ConsultContext>("life");
  const [posture, setPosture] = useState<ConsultPosture>("empathisch");
  const [signal, setSignal] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  return (
    <main className="relative isolate overflow-hidden">
      <PracticeNav />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28">
        <ConsultHeader />

        <section
          id="form"
          aria-labelledby="form-heading"
          className="subtle-panel flex flex-col gap-6 p-6 sm:p-8"
        >
          <h2
            id="form-heading"
            className="font-display text-2xl uppercase tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Ask the matrix
          </h2>

          <ContextSelector value={context} onChange={setContext} />
          <PostureSelector value={posture} onChange={setPosture} />
          <ConsultInput value={signal} onChange={setSignal} context={context} />

          <button
            type="button"
            disabled={signal.trim().length === 0}
            onClick={() => setSubmitted(true)}
            className="glass-card inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-anomaly/30 bg-anomaly/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-anomaly transition-all duration-300 hover:-translate-y-0.5 hover:border-anomaly/50 hover:bg-anomaly/18 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            aria-label="Aus der Matrix ziehen — submit the consult request"
          >
            Aus der Matrix ziehen
          </button>
          {signal.trim().length === 0 ? (
            <p
              id="consult-help-empty"
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted"
            >
              Type a question to enable the matrix.
            </p>
          ) : null}

          {submitted ? (
            <div role="status" aria-live="polite" className="flex flex-col gap-2">
              <p className="text-sm leading-6 text-zinc-200">
                API wird in Woche 3 verkabelt. Bis dahin ist dies ein UI-Skeleton.
              </p>
              <div
                aria-hidden
                className="flex items-center gap-1 font-display text-xl text-anomaly"
              >
                {GLYPH_PULSE.map((glyph, index) => (
                  <span
                    key={`${glyph}-${index}`}
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    {glyph}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section
          id="answer"
          aria-live="polite"
          aria-labelledby="answer-heading"
          className="flex flex-col gap-5"
        >
          <h2
            id="answer-heading"
            className="font-display text-2xl uppercase tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Answer
          </h2>
          {submitted ? (
            <StubAnswer onReset={() => setSubmitted(false)} />
          ) : (
            <div className="subtle-panel p-6">
              <p className="text-sm leading-7 text-zinc-300">
                Hier erscheint deine Antwort aus der Lead-Stimme, sobald das
                /api/consult Endpoint in Week 3 live geht.
              </p>
            </div>
          )}
        </section>

        <section id="compliance" className="scroll-mt-24">
          <PracticeCompliance />
        </section>

        <FooterManifest showPractice />
      </div>
    </main>
  );
}

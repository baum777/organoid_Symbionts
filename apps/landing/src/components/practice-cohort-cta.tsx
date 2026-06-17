import { Reveal } from "@/components/reveal";
import { practice } from "@/lib/content";

// Week 2 / D1 — group-cohort CTA. Layout collapses from a 2-column row on
// md+ to a single vertical stack on mobile. mailtoHref is a placeholder
// (see the comment in lib/content.ts).
export function PracticeCohortCta() {
  const c = practice.cohort;
  return (
    <Reveal>
      <div className="subtle-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
              {c.eyebrow}
            </p>
            <h2 className="font-display text-2xl uppercase tracking-[-0.04em] text-ink sm:text-3xl">
              {c.heading}
            </h2>
            <p className="text-sm leading-7 text-zinc-300 sm:text-base">{c.body}</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-2">
              {c.chips.map((chip) => (
                <span key={chip} className="chip">
                  {chip}
                </span>
              ))}
            </div>
            {/*
              The cohort sign-up is gated until a real booking inbox is set
              (the mailtoHref in content.ts is currently a placeholder). When
              the real address is added, swap the disabled button below for
              an <a href={c.mailtoHref}> with the same styling.
            */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-zinc-400"
            >
              {c.mailtoLabel}
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

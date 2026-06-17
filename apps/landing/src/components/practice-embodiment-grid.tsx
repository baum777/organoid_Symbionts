import { practice, type EmbodimentEntry } from "@/lib/content";
import { cn } from "@/lib/utils";
import { toneColors, toneNames, type ToneKey } from "@/lib/theme";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import Link from "next/link";
import type { CSSProperties } from "react";

export function PracticeEmbodimentGrid() {
  const entries = practice.embodiments;
  const firstThree = entries.slice(0, 3);
  const lastFour = entries.slice(3);

  return (
    <div>
      <SectionHeading
        eyebrow="02 / 7 voices"
        title="Seven voices in one body"
        description="Each one a different way the matrix speaks. Pick the one that fits what you are holding today."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {firstThree.map((entry, index) => (
          <EmbodimentCard key={entry.id} entry={entry} index={index} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {lastFour.map((entry, index) => (
          <EmbodimentCard key={entry.id} entry={entry} index={index + 3} />
        ))}
      </div>
    </div>
  );
}

function EmbodimentCard({ entry, index }: { entry: EmbodimentEntry; index: number }) {
  const accent = toneColors[entry.tone as ToneKey];
  const toneLabel = toneNames[entry.tone as ToneKey];

  return (
    <Reveal delay={index * 70}>
      <Link
        href={`/practice/embodiments/${entry.id}`}
        aria-label={`${entry.name} voice — open detail page`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        <article
          className={cn(
            "glass-card relative h-full overflow-hidden border border-white/10 p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20",
          )}
          style={{ ["--card-accent" as string]: accent } as CSSProperties}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--card-accent)]" />
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-400">
              {`Stimme / ${entry.role}`}
            </p>
          </div>
          <span
            role="img"
            aria-label={`Glyph: ${entry.name}`}
            className="mt-4 block font-display text-3xl text-ink"
          >
            {entry.glyph}
          </span>
          <h3 className="mt-3 font-display text-xl uppercase tracking-[-0.04em] text-ink">
            {entry.name}
          </h3>
          <div className="mt-4 space-y-3">
            <div className="subtle-panel p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Classical function</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{entry.classical}</p>
            </div>
            <div className="subtle-panel p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Coaching</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{entry.coachingFunction}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm leading-6 text-zinc-300">
            {entry.useWhen.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="text-zinc-500">→</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="chip border-white/8 bg-white/5 text-zinc-200">{toneLabel}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              {`→ /practice/embodiments/${entry.id}`}
            </span>
          </div>
        </article>
      </Link>
    </Reveal>
  );
}

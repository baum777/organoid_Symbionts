import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { practice } from "@/lib/content";

export function PracticeHero() {
  return (
    <Reveal>
      <div className="max-w-3xl">
        <div className="flex flex-wrap gap-2">
          <span className="chip">coaching / 5 phases / 7 voices</span>
        </div>

        <h1 className="mt-6 max-w-3xl font-display text-5xl uppercase leading-[0.9] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">
          {practice.hero.headline}
        </h1>

        <div className="subtle-panel mt-6 p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">{practice.hero.name}</p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            {practice.hero.bio}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={practice.hero.primaryCtaHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-anomaly/30 bg-anomaly/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-anomaly transition-all duration-300 hover:-translate-y-0.5 hover:border-anomaly/50 hover:bg-anomaly/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          >
            {practice.hero.primaryCtaLabel}
          </Link>
          <Link
            href={practice.hero.secondaryCtaHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          >
            {practice.hero.secondaryCtaLabel}
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

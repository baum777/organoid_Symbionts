import { content } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import type { CSSProperties } from "react";

const accentByTone = {
  bio: "#6EE7B7",
  interface: "#67E8F9",
  meme: "#E879F9",
  anchor: "#FAFAFA",
  neutral: "#A1A1AA",
} as const;

export function ArchetypeGrid() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {content.sections.archetypes.cards.map((card, index) => {
        const accent = accentByTone[card.tone];
        return (
          <Reveal key={card.name} delay={index * 90}>
            <article
              className="glass-card relative overflow-hidden border border-white/10 p-5 transition-transform duration-300 hover:-translate-y-1"
              style={{ ["--archetype-accent" as string]: accent } as CSSProperties}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--archetype-accent)]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-400">Archetype</p>
              </div>
              <h3 className="mt-4 font-display text-2xl uppercase tracking-[-0.04em] text-ink">{card.name}</h3>
              <div className="mt-4 space-y-3">
                <div className="subtle-panel p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Classical function</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{card.classicalFunction}</p>
                </div>
                <div className="subtle-panel p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--archetype-accent)]">
                    Wetware rewrite
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">{card.wetwareRewrite}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className={cn("chip", "border-white/8 bg-white/5 text-zinc-200")}>Knowing, not goofy</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                  {card.tone === "anchor" ? "canon" : "signal"}
                </span>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

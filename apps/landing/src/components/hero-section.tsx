import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { SignalCard } from "@/components/signal-card";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12">
      <Reveal>
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{content.hero.eyebrow}</span>
            {content.hero.chips.map((chip) => (
              <span key={chip} className="chip">
                {chip}
              </span>
            ))}
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-5xl uppercase leading-[0.9] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">
            {content.hero.title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
            {content.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#reality"
              className="inline-flex items-center justify-center rounded-full border border-lumen/30 bg-lumen/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-lumen transition-all duration-300 hover:-translate-y-0.5 hover:border-lumen/50 hover:bg-lumen/18"
            >
              {content.hero.primaryCta}
            </Link>
            <Link
              href="#bottlenecks"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8"
            >
              {content.hero.secondaryCta}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {content.hero.cards.map((card, index) => (
              <Reveal key={card.title} delay={index * 100}>
                <SignalCard compact {...card} />
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="section-shell relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute right-[-3rem] top-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(103,232,249,0.18)_0%,_transparent_72%)] blur-3xl" />
          <div className="absolute bottom-[-4rem] left-[-2rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(110,231,183,0.16)_0%,_transparent_72%)] blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Substrate readout</p>
                <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.04em] text-ink">
                  Biohybrid stack
                </h2>
              </div>
              <span className="chip">Interface before mythology</span>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-[#0c0c10] p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                <div className="rounded-[1.25rem] border border-lumen/20 bg-lumen/8 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-lumen">Bio node</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">Living tissue with memory, instability, and adaptation.</p>
                </div>
                <div className="grid place-items-center text-2xl text-signal md:px-2">↔</div>
                <div className="rounded-[1.25rem] border border-signal/20 bg-signal/8 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">Interface lane</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">Measurement, routing, stimulation, and the actual control plane.</p>
                </div>
                <div className="grid place-items-center text-2xl text-anomaly md:px-2">↔</div>
                <div className="rounded-[1.25rem] border border-anomaly/20 bg-anomaly/8 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-anomaly">Silicon lane</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">Timing, orchestration, storage, and every boring piece that keeps it coherent.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Latency", value: "Readout pressure" },
                { label: "State", value: "Shared SSOT" },
                { label: "Risk", value: "Interface drift" },
              ].map((item) => (
                <div key={item.label} className="subtle-panel p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">{item.label}</p>
                  <p className="mt-3 text-sm text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

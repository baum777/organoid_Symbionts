import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { SignalCard } from "@/components/signal-card";

export function BiohybridRealitySection() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
      <Reveal>
        <div className="section-shell flex h-full flex-col justify-between gap-6 p-6">
          <div>
            <p className="font-display text-3xl uppercase leading-[0.92] tracking-[-0.05em] text-ink sm:text-4xl">
              {content.sections.reality.thesis}
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-300 sm:text-base">
              {content.sections.reality.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Control", "Routing", "Timing", "Measurement"].map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {content.sections.reality.points.map((point, index) => (
          <Reveal key={point.title} delay={index * 90}>
            <SignalCard {...point} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

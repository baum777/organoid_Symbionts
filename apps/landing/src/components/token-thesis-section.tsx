import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function TokenThesisSection() {
  return (
    <Reveal>
      <div className="section-shell mt-8 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-anomaly/15 bg-anomaly/8 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-anomaly">Thesis</p>
            <p className="mt-4 font-display text-3xl uppercase leading-[0.95] tracking-[-0.05em] text-ink sm:text-4xl">
              The token is a signal amplifier, not a science claim.
            </p>
          </div>

          <p className="text-sm leading-7 text-zinc-300 sm:text-base">{content.sections.token.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="subtle-panel p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-lumen">What it is</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
              {content.sections.token.is.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lumen" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="subtle-panel p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-anomaly">What it is not</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
              {content.sections.token.isNot.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-anomaly" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

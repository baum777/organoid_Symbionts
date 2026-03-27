import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function PalettePanel() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
      <Reveal>
        <div className="section-shell h-full p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {content.sections.palette.entries.map((entry, index) => (
              <div key={entry.name} className="glass-card overflow-hidden border border-white/10 p-4">
                <div
                  className="h-24 rounded-[1rem] border border-white/8"
                  style={{
                    background:
                      entry.tone === "bio"
                        ? "linear-gradient(135deg, rgba(110,231,183,0.3), rgba(110,231,183,0.04))"
                        : entry.tone === "interface"
                          ? "linear-gradient(135deg, rgba(103,232,249,0.3), rgba(103,232,249,0.04))"
                          : entry.tone === "meme"
                            ? "linear-gradient(135deg, rgba(232,121,249,0.3), rgba(232,121,249,0.04))"
                            : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  }}
                />
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xl uppercase tracking-[-0.03em] text-ink">{entry.name}</p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">{entry.hex}</p>
                  </div>
                  <span className="chip">{index + 1}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{entry.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="section-shell flex h-full flex-col justify-between gap-6 p-6">
          <div>
            <p className="font-display text-3xl uppercase tracking-[-0.05em] text-ink">Color as argument</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300 sm:text-base">
              The palette is not decorative. It encodes the whole thesis: living substrate, instrumented
              readout, memetic heat, and the negative space needed for the message to land.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Bio = living", "Cyan = readout", "Fuchsia = meme"].map((label) => (
              <div key={label} className="subtle-panel p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

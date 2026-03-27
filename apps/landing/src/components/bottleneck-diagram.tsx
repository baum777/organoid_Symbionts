import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { SignalCard } from "@/components/signal-card";

export function BottleneckDiagram() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {content.sections.bottlenecks.items.map((item, index) => {
          const spanClass =
            index === 0 ? "sm:col-span-2" : index === 1 ? "" : index === 2 ? "" : "sm:col-span-2";

          return (
            <Reveal key={item.title} delay={index * 90}>
              <SignalCard {...item} className={spanClass} />
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={120}>
        <div className="section-shell flex h-full flex-col justify-between gap-6 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">Volumetric tissue</span>
              <span className="chip">Planar readout</span>
              <span className="chip">Maintenance bill</span>
            </div>
            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-[#0c0c10] p-4">
              <svg
                viewBox="0 0 720 420"
                role="img"
                aria-label="Bio node to interface to silicon bottleneck diagram"
                className="h-auto w-full"
              >
                <defs>
                  <linearGradient id="lane" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#67E8F9" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#E879F9" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="720" height="420" rx="28" fill="rgba(255,255,255,0.02)" />
                <path d="M100 210H620" stroke="url(#lane)" strokeWidth="4" strokeLinecap="round" />
                <path d="M100 210C160 162 206 162 244 210" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
                <path d="M244 210C282 258 336 258 372 210" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
                <path d="M372 210C414 162 466 162 512 210" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
                <path d="M512 210C552 258 592 258 620 210" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />

                <g>
                  <circle cx="100" cy="210" r="42" fill="rgba(110,231,183,0.12)" stroke="#6EE7B7" strokeWidth="3" />
                  <text x="100" y="204" textAnchor="middle" fill="#fafafa" fontSize="16" fontFamily="IBM Plex Mono, monospace">
                    bio
                  </text>
                  <text x="100" y="228" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    tissue
                  </text>
                </g>

                <g>
                  <circle cx="360" cy="210" r="46" fill="rgba(103,232,249,0.12)" stroke="#67E8F9" strokeWidth="3" />
                  <text x="360" y="204" textAnchor="middle" fill="#fafafa" fontSize="16" fontFamily="IBM Plex Mono, monospace">
                    I/O
                  </text>
                  <text x="360" y="228" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    interface
                  </text>
                </g>

                <g>
                  <circle cx="620" cy="210" r="42" fill="rgba(232,121,249,0.12)" stroke="#E879F9" strokeWidth="3" />
                  <text x="620" y="204" textAnchor="middle" fill="#fafafa" fontSize="16" fontFamily="IBM Plex Mono, monospace">
                    silicon
                  </text>
                  <text x="620" y="228" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    control
                  </text>
                </g>

                <g>
                  <rect x="178" y="90" width="138" height="52" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
                  <text x="247" y="112" textAnchor="middle" fill="#fafafa" fontSize="13" fontFamily="IBM Plex Mono, monospace">
                    3D tissue
                  </text>
                  <text x="247" y="129" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    volumetric state
                  </text>
                </g>

                <g>
                  <rect x="404" y="90" width="138" height="52" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
                  <text x="473" y="112" textAnchor="middle" fill="#fafafa" fontSize="13" fontFamily="IBM Plex Mono, monospace">
                    planar readout
                  </text>
                  <text x="473" y="129" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    sparse capture
                  </text>
                </g>

                <g>
                  <rect x="257" y="286" width="206" height="50" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" />
                  <text x="360" y="308" textAnchor="middle" fill="#fafafa" fontSize="13" fontFamily="IBM Plex Mono, monospace">
                    bottleneck = measurement + control
                  </text>
                  <text x="360" y="325" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                    not just ambition
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="subtle-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Reality check</p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              The myth is sentience. The actual engineering problem is readout density, stability,
              and the ability to make the signal legible without collapsing the substrate.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
              {content.sections.bottlenecks.callout}
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

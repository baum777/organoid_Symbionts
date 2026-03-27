import type { SignalCardContent } from "@/lib/content";
import { cn } from "@/lib/utils";
import { toneColors, toneNames, type ToneKey } from "@/lib/theme";
import type { CSSProperties } from "react";

type SignalCardProps = SignalCardContent & {
  className?: string;
  compact?: boolean;
};

const accentByTone = toneColors;

export function SignalCard({ eyebrow, title, body, tone, meta, className, compact = false }: SignalCardProps) {
  const accent = accentByTone[tone as ToneKey];

  return (
    <article
      className={cn(
        "glass-card group relative overflow-hidden border border-white/10 transition-transform duration-300 hover:-translate-y-1 hover:border-white/20",
        compact ? "p-4" : "p-5",
        className,
      )}
      style={{ ["--card-accent" as string]: accent } as CSSProperties}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0%,_transparent_68%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--card-accent)]" />
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-400">
          {eyebrow} / {toneNames[tone as ToneKey]}
        </p>
      </div>
      <h3 className={cn("mt-4 font-display tracking-[-0.03em] text-ink", compact ? "text-lg" : "text-xl")}>{title}</h3>
      <p className={cn("mt-3 leading-6 text-zinc-300", compact ? "text-sm" : "text-sm sm:text-[0.98rem]")}>{body}</p>
      {meta ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">{meta}</p>
      ) : null}
    </article>
  );
}

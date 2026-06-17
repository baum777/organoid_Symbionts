import Link from "next/link";

export function ConsultHeader() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/practice"
        className="self-start rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:bg-white/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        ← Back to /practice
      </Link>
      <span className="chip self-start">
        reflection companion · API wiring in week 3
      </span>
      <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
        Try the matrix
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
        One question. One answer from the lead voice. The counterweight and
        anchor come along for the ride. Nothing here is a clinical read —
        this is a reflection companion.
      </p>
    </div>
  );
}

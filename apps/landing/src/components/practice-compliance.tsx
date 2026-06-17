import { practice } from "@/lib/content";

export function PracticeCompliance() {
  return (
    <div className="subtle-panel mx-auto max-w-3xl p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
        {practice.compliance.eyebrow}
      </p>
      <p className="mt-3 text-sm leading-7 text-zinc-300">
        {practice.compliance.body}
      </p>
      <div className="mt-5 flex flex-col gap-2 border-t border-white/8 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Crisis?</p>
        <a
          href={practice.compliance.crisisInternational.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${practice.compliance.crisisInternational.label} (opens in new tab)`}
          className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-200 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          {practice.compliance.crisisInternational.label} (new tab)
        </a>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300">
          DE: Telefonseelsorge {practice.compliance.crisisDe.tel}
        </p>
      </div>
    </div>
  );
}

import { SectionHeading } from "@/components/section-heading";
import { SignalCard } from "@/components/signal-card";
import { Reveal } from "@/components/reveal";
import { practice } from "@/lib/content";

// Week 2 / D1 — three ways to work together (Deep / Burst / Group).
// Numbers the section as "03" to continue the /practice scroll
// (01 methodology, 02 embodiments, 03 session types, cohort CTA follows).
export function PracticeSessionTypes() {
  return (
    <div>
      <SectionHeading
        eyebrow="03 / how we work"
        title="Three ways to work with me"
        description="Solo, deep, or in a group. Pick the format that fits what you're holding this season."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {practice.sessionTypes.map((entry, index) => (
          <Reveal key={entry.title} delay={index * 70}>
            <SignalCard
              eyebrow={entry.eyebrow}
              title={entry.title}
              body={entry.body}
              meta={entry.meta}
              tone={entry.tone}
            />
          </Reveal>
        ))}
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
        Booking opens with the next pilot cohort. For now: matrix-only, free, on{" "}
        <a
          href="/consult"
          className="underline-offset-4 hover:text-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          /consult
        </a>
        .
      </p>
    </div>
  );
}

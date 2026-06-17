import { PracticeNav } from "@/components/practice-nav";
import { PracticeHero } from "@/components/practice-hero";
import { PracticeMethodology } from "@/components/practice-methodology";
import { PracticeEmbodimentGrid } from "@/components/practice-embodiment-grid";
import { PracticeSessionTypes } from "@/components/practice-session-types";
import { PracticeCohortCta } from "@/components/practice-cohort-cta";
import { PracticeCompliance } from "@/components/practice-compliance";
import { FooterManifest } from "@/components/footer-manifest";

export default function PracticePage() {
  return (
    <main className="relative isolate overflow-hidden">
      <PracticeNav />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28">
        <section id="hero" className="scroll-mt-24">
          <PracticeHero />
        </section>

        <section id="methodology" className="scroll-mt-24">
          <PracticeMethodology />
        </section>

        <section id="embodiments" className="scroll-mt-24">
          <PracticeEmbodimentGrid />
        </section>

        <section id="session-types" className="scroll-mt-24">
          <PracticeSessionTypes />
        </section>

        <section id="cohort" className="scroll-mt-24">
          <PracticeCohortCta />
        </section>

        <section id="contact" className="scroll-mt-24">
          <div className="subtle-panel mx-auto max-w-3xl p-6 sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
              Booking a session
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300 sm:text-base">
              Reach out via email and tell me what is on your mind. I read
              every message and reply within 48 hours.
            </p>
            {/*
              The mailto address below is a placeholder (practice@example.org).
              Replace with the real booking inbox before going live.
            */}
            <a
              href="mailto:practice@example.org?subject=Booking%20enquiry"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border border-anomaly/30 bg-anomaly/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-anomaly transition-all duration-300 hover:-translate-y-0.5 hover:border-anomaly/50 hover:bg-anomaly/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            >
              Reach out via email
            </a>
          </div>
        </section>

        <section id="compliance" className="scroll-mt-24">
          <PracticeCompliance />
        </section>

        <FooterManifest showPractice />
      </div>
    </main>
  );
}

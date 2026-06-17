import { PracticeNav } from "@/components/practice-nav";
import { PracticeHero } from "@/components/practice-hero";
import { PracticeMethodology } from "@/components/practice-methodology";
import { PracticeEmbodimentGrid } from "@/components/practice-embodiment-grid";
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

        <section id="contact" className="scroll-mt-24">
          <p className="text-sm font-mono text-muted">
            Booking is opening soon. Until then, try the matrix or reach out via email.
          </p>
        </section>

        <section id="compliance" className="scroll-mt-24">
          <PracticeCompliance />
        </section>

        <FooterManifest showPractice />
      </div>
    </main>
  );
}

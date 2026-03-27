import { ArchetypeGrid } from "@/components/archetype-grid";
import { BiohybridRealitySection } from "@/components/reality-section";
import { BottleneckDiagram } from "@/components/bottleneck-diagram";
import { ClusterSection } from "@/components/cluster-section";
import { FooterManifest } from "@/components/footer-manifest";
import { HeroSection } from "@/components/hero-section";
import { TokenSurface } from "@/components/token-surface";
import { PalettePanel } from "@/components/palette-panel";
import { LiveSignalPreview } from "@/components/live-signal-preview";
import { SectionHeading } from "@/components/section-heading";
import { SignalCard } from "@/components/signal-card";
import { SiteHeader } from "@/components/site-header";
import { SnippetWall } from "@/components/snippet-wall";
import { TokenThesisSection } from "@/components/token-thesis-section";
import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28">
        <HeroSection />
        <TokenSurface />

        <section id="wetware" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.wetware.eyebrow}
              title={content.sections.wetware.title}
              description={content.sections.wetware.description}
            />
          </Reveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-12">
            {content.sections.wetware.points.map((point, index) => {
              const spanClass =
                index === 0
                  ? "lg:col-span-7"
                  : index === 1
                    ? "lg:col-span-5"
                    : "lg:col-span-6 lg:col-start-7";

              return (
                <Reveal key={point.title} delay={index * 90}>
                  <SignalCard
                    tone={point.tone}
                    eyebrow={point.eyebrow}
                    title={point.title}
                    body={point.body}
                    className={spanClass}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="hype" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.hype.eyebrow}
              title={content.sections.hype.title}
              description={content.sections.hype.description}
            />
          </Reveal>
          <ClusterSection />
        </section>

        <section id="bottlenecks" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.bottlenecks.eyebrow}
              title={content.sections.bottlenecks.title}
              description={content.sections.bottlenecks.description}
            />
          </Reveal>
          <BottleneckDiagram />
        </section>

        <section id="reality" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.reality.eyebrow}
              title={content.sections.reality.title}
              description={content.sections.reality.description}
            />
          </Reveal>
          <BiohybridRealitySection />
        </section>

        <section id="archetypes" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.archetypes.eyebrow}
              title={content.sections.archetypes.title}
              description={content.sections.archetypes.description}
            />
          </Reveal>
          <ArchetypeGrid />
        </section>

        <section id="snippets" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.snippets.eyebrow}
              title={content.sections.snippets.title}
              description={content.sections.snippets.description}
            />
          </Reveal>
          <SnippetWall />
        </section>

        <section id="palette" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.palette.eyebrow}
              title={content.sections.palette.title}
              description={content.sections.palette.description}
            />
          </Reveal>
          <PalettePanel />
        </section>

        <section id="token" className="scroll-mt-24">
          <Reveal>
            <SectionHeading
              eyebrow={content.sections.token.eyebrow}
              title={content.sections.token.title}
              description={content.sections.token.description}
            />
          </Reveal>
          <TokenThesisSection />
        </section>

        <FooterManifest />
        <LiveSignalPreview />
      </div>
    </main>
  );
}

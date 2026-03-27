import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { SignalCard } from "@/components/signal-card";

export function ClusterSection() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-3">
      {content.sections.hype.clusters.map((cluster, index) => (
        <Reveal key={cluster.title} delay={index * 80}>
          <SignalCard {...cluster} />
        </Reveal>
      ))}
    </div>
  );
}

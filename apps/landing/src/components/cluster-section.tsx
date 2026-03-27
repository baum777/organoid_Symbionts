import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { SignalCard } from "@/components/signal-card";

export function ClusterSection() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-12">
      {content.sections.hype.clusters.map((cluster, index) => {
        const spanClass =
          index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : "lg:col-span-8 lg:col-start-5";

        return (
          <Reveal key={cluster.title} delay={index * 80}>
            <SignalCard {...cluster} className={spanClass} />
          </Reveal>
        );
      })}
    </div>
  );
}

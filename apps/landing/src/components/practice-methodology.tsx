import { SectionHeading } from "@/components/section-heading";
import { SignalCard } from "@/components/signal-card";
import { practice } from "@/lib/content";

export function PracticeMethodology() {
  return (
    <div>
      <SectionHeading
        eyebrow={practice.methodology.eyebrow}
        title={practice.methodology.title}
        description={practice.methodology.description}
      />
      <div className="mt-8 flex flex-col gap-4 lg:flex-row">
        {practice.methodology.phases.map((phase, index) => (
          <SignalCard
            key={phase.id}
            tone="interface"
            eyebrow={`0${index + 1} / ${phase.id}`}
            title={phase.name}
            body={phase.function}
            meta={phase.sampleQuestion}
            className="lg:flex-1"
          />
        ))}
      </div>
    </div>
  );
}

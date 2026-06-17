"use client";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SignalCard } from "@/components/signal-card";
import { getSemanticBridgePreview, type SemanticBridgePreview } from "@/lib/semantic-bridge";
import { useEffect, useState } from "react";

export function LiveSignalPreview() {
  // SSR-safe initial state: `null` means "not loaded yet". The server's
  // first render and the client's first render both see this same value,
  // so hydration is deterministic. The real preview is fetched in
  // useEffect; until it arrives we render a structurally identical
  // placeholder so the section never shows a hydration mismatch.
  const [preview, setPreview] = useState<SemanticBridgePreview | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      try {
        const response = await fetch("/api/live-signal", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.ok) {
          const nextPreview = (await response.json()) as SemanticBridgePreview;
          setPreview(nextPreview);
          return;
        }
        // Non-OK: use local fallback (still client-side, so no SSR mismatch).
        setPreview(getSemanticBridgePreview());
      } catch {
        setPreview(getSemanticBridgePreview());
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, []);

  // Loading state: same section shape, deterministic placeholder copy.
  if (!preview) {
    return (
      <section
        id="live-signal"
        className="scroll-mt-24 border-t border-white/10 pt-10 sm:pt-12"
        aria-busy="true"
      >
        <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <Reveal>
            <div className="space-y-4">
              <SectionHeading
                eyebrow="System trace"
                title="Read-only residue"
                description="A low-volume echo from the live seam. Alive enough to matter. Detached enough to stay safe."
              />

              <div className="flex flex-wrap gap-2">
                <span className="chip">Observed …</span>
                <span className="chip">Dominant …</span>
                <span className="chip">Mode …</span>
              </div>

              <Reveal delay={120}>
                <p className="max-w-xl text-sm leading-7 text-zinc-400">
                  Loading live signal…
                </p>
              </Reveal>
            </div>
          </Reveal>

          <div className="space-y-4" aria-hidden="true" />
        </div>
      </section>
    );
  }

  return (
    <section id="live-signal" className="scroll-mt-24 border-t border-white/10 pt-10 sm:pt-12">
      <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <Reveal>
          <div className="space-y-4">
            <SectionHeading
              eyebrow="System trace"
              title="Read-only residue"
              description="A low-volume echo from the live seam. Alive enough to matter. Detached enough to stay safe."
            />

            <div className="flex flex-wrap gap-2">
              <span className="chip">Observed {new Date(preview.observedAt).toLocaleTimeString()}</span>
              <span className="chip">Dominant {preview.dominantEmbodiment}</span>
              <span className="chip">Mode {preview.lastOrchestrationMode}</span>
            </div>

            <Reveal delay={120}>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">{preview.sampleAuditTrace}</p>
            </Reveal>
          </div>
        </Reveal>

        <div className="space-y-4">
          {preview.signals.map((signal, index) => (
            <Reveal key={signal.id} delay={index * 80}>
              <SignalCard
                compact
                {...signal}
                className={index === 0 ? "lg:ml-12" : index === 1 ? "lg:ml-4" : "lg:ml-20"}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SignalCard } from "@/components/signal-card";
import { getSemanticBridgePreview, type SemanticBridgePreview } from "@/lib/semantic-bridge";
import { useEffect, useState } from "react";

export function LiveSignalPreview() {
  const [preview, setPreview] = useState<SemanticBridgePreview>(() => getSemanticBridgePreview());

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      try {
        const response = await fetch("/api/live-signal", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const nextPreview = (await response.json()) as SemanticBridgePreview;
        setPreview(nextPreview);
      } catch {
        // Read-only preview; local fallback stays in place on request failure.
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, []);

  return (
    <section id="live-signal" className="scroll-mt-24 border-t border-white/10 pt-10 sm:pt-12">
      <Reveal>
        <SectionHeading
          eyebrow="Live Signal (Preview)"
          title="Read-only bridge to the live stack"
          description="A minimal semantic preview that looks alive, but stays decoupled from the worker runtime."
        />
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {preview.signals.map((signal, index) => (
          <Reveal key={signal.id} delay={index * 80}>
            <SignalCard compact {...signal} />
          </Reveal>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="chip">Observed at {new Date(preview.observedAt).toLocaleString()}</span>
        <span className="chip">Dominant {preview.dominantEmbodiment}</span>
        <span className="chip">Mode {preview.lastOrchestrationMode}</span>
      </div>

      <Reveal delay={120}>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
          {preview.sampleAuditTrace}
        </p>
      </Reveal>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

import { PracticeNav } from "@/components/practice-nav";
import { PracticeCompliance } from "@/components/practice-compliance";
import { FooterManifest } from "@/components/footer-manifest";
import { ConsultHeader } from "@/components/consult-header";
import { ContextSelector } from "@/components/consult-context-selector";
import { PostureSelector } from "@/components/consult-posture-selector";
import { ConsultInput } from "@/components/consult-input";
import { ConsultAnswer } from "@/components/consult-answer";
import {
  GLYPH_PULSE,
  SIGNAL_MAX,
  type ConsultContext,
  type ConsultLocale,
  type ConsultPosture,
  type ConsultStatus,
} from "@/lib/consult/constants";
import type { ConsultResponse } from "@/lib/consult/types";

// --- Page -------------------------------------------------------------

export default function ConsultPage() {
  const [context, setContext] = useState<ConsultContext>("life");
  const [posture, setPosture] = useState<ConsultPosture>("empathisch");
  const [signal, setSignal] = useState<string>("");
  // status: "idle" before any submit, "loading" during the
  // fetch, "success" when an answer is shown, "error" on a
  // failed request. The Week 3 implementation hits /api/consult
  // and renders the structured response.
  const [status, setStatus] = useState<ConsultStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<ConsultResponse | null>(null);
  // Locale is fixed to "de" for Week 3. The architecture supports
  // dynamic locale; the actual i18n wiring is a Phase 3 task.
  const [locale] = useState<ConsultLocale>("de");

  // When the user changes context or posture after submitting, the
  // previous answer is no longer accurate. Reset to "idle" so the next
  // submit re-runs cleanly. `status` and `error` are intentionally
  // omitted from the deps: we want this effect to fire only on
  // context/posture change, never as a side effect of status/error
  // change themselves.
  useEffect(() => {
    if (status !== "idle") {
      setStatus("idle");
      setError(null);
      setAnswer(null);
    }
  }, [context, posture]);

  const canSubmit = signal.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("loading");
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signal: signal.slice(0, SIGNAL_MAX),
          context,
          posture,
          locale,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("error");
        setError(body?.error ?? `HTTP ${response.status}`);
        return;
      }
      const data = (await response.json()) as ConsultResponse;
      setAnswer(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setError(null);
    setAnswer(null);
    setSignal("");
  }

  return (
    <main className="relative isolate overflow-hidden">
      <PracticeNav />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28">
        <ConsultHeader />

        <section
          id="form"
          aria-labelledby="form-heading"
          className="subtle-panel flex flex-col gap-6 p-6 sm:p-8"
        >
          <h2
            id="form-heading"
            className="font-display text-2xl uppercase tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Ask the matrix
          </h2>

          <ContextSelector value={context} onChange={setContext} />
          <PostureSelector value={posture} onChange={setPosture} />
          <ConsultInput value={signal} onChange={setSignal} context={context} />

          <button
            type="button"
            disabled={!canSubmit || status === "loading"}
            onClick={handleSubmit}
            className="glass-card inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-anomaly/30 bg-anomaly/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.26em] text-anomaly transition-all duration-300 hover:-translate-y-0.5 hover:border-anomaly/50 hover:bg-anomaly/18 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            aria-label="Aus der Matrix ziehen — submit the consult request"
          >
            {status === "loading" ? "Reading the matrix…" : "Aus der Matrix ziehen"}
          </button>
          {!canSubmit ? (
            <p
              id="consult-help-empty"
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted"
            >
              Type a question to enable the matrix.
            </p>
          ) : null}

          {status === "loading" ? (
            <div role="status" aria-live="polite" className="flex flex-col gap-2">
              <p className="text-sm leading-6 text-zinc-200">
                {locale === "de"
                  ? "Die Matrix liest deine Frage…"
                  : "The matrix is reading your question…"}
              </p>
              <div
                aria-hidden
                className="flex items-center gap-1 font-display text-xl text-anomaly"
              >
                {GLYPH_PULSE.map((glyph, index) => (
                  <span
                    key={`${glyph}-${index}`}
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    {glyph}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section
          id="answer"
          aria-live="polite"
          aria-labelledby="answer-heading"
          className="flex flex-col gap-5"
        >
          <h2
            id="answer-heading"
            className="font-display text-2xl uppercase tracking-[-0.03em] text-ink sm:text-3xl"
          >
            Answer
          </h2>
          {status === "success" && answer ? (
            <ConsultAnswer response={answer} onReset={handleReset} />
          ) : status === "error" ? (
            <div className="subtle-panel p-6" role="alert">
              <p className="text-sm leading-7 text-zinc-300">
                Something went wrong. {error ?? "Please try again."}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="subtle-panel p-6">
              <p className="text-sm leading-7 text-zinc-300">
                Hier erscheint deine Antwort aus der Lead-Stimme, sobald du
                eine Frage stellst.
              </p>
            </div>
          )}
        </section>

        <section id="compliance" className="scroll-mt-24">
          <PracticeCompliance />
        </section>

        <FooterManifest showPractice />
      </div>
    </main>
  );
}

"use client";

import { Reveal } from "@/components/reveal";
import { content } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 4h4.8l4.3 6.2L18.9 4H19l-5.2 7.1L19.5 20H14.7l-4.6-6.7L5.3 20H5l5.5-7.6L5 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DexIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6 15.5 12 9.5l4 4 2-2V18H7.5L6 15.5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6 6h12v2H6zM6 10h5v2H6z"
        fill="currentColor"
      />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M9 9V5.8C9 4.8 9.8 4 10.8 4h6.4C18.2 4 19 4.8 19 5.8v6.4c0 1-.8 1.8-1.8 1.8H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 9h6.2c1 0 1.8.8 1.8 1.8V17c0 1-.8 1.8-1.8 1.8H8c-1 0-1.8-.8-1.8-1.8v-6.2C6.2 9.8 7 9 8 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function TokenSurface() {
  const [copied, setCopied] = useState(false);
  const address = content.surface.ca;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        return;
      }

      const fallback = document.createElement("textarea");
      fallback.value = address;
      fallback.setAttribute("readonly", "true");
      fallback.style.position = "absolute";
      fallback.style.left = "-9999px";
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      document.body.removeChild(fallback);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="signal-surface" className="scroll-mt-24">
      <Reveal>
        <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="section-shell relative overflow-hidden p-5 sm:p-6">
            <div className="absolute -right-10 top-2 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(232,121,249,0.15)_0%,_transparent_70%)] blur-3xl" />
            <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,_rgba(103,232,249,0.15)_0%,_transparent_70%)] blur-2xl" />

            <p className="section-label">signal fragments</p>
            <div className="mt-4 space-y-3">
              {content.surface.fragments.map((line, index) => (
                <p
                  key={line}
                  className={cn(
                    "max-w-md font-display uppercase leading-[0.92] tracking-[-0.05em] text-ink",
                    index === 0 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl text-zinc-200",
                  )}
                >
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip">ritual object</span>
              <span className="chip">bio-digital</span>
              <span className="chip">token aura</span>
            </div>
          </div>

          <div className="section-shell relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(110,231,183,0.14),transparent_24%),radial-gradient(circle_at_80%_40%,rgba(232,121,249,0.12),transparent_22%),radial-gradient(circle_at_22%_70%,rgba(103,232,249,0.12),transparent_24%)] opacity-90" />
            <div className="pointer-events-none absolute inset-0 noise-skin opacity-35" />

            <div className="relative mx-auto max-w-4xl text-center">
              <p className="section-label">CA / copy the strand</p>

              <button
                type="button"
                onClick={handleCopy}
                className="mt-4 w-full rounded-[2rem] border border-white/12 bg-white/[0.045] px-5 py-6 text-left shadow-[0_18px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-lumen">CA</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-300">
                    <CopyGlyph />
                    copy
                  </span>
                </div>
                <p className="mt-4 break-all font-mono text-[clamp(1rem,2.1vw,1.45rem)] leading-[1.45] tracking-[0.18em] text-ink">
                  {address}
                </p>
              </button>

              <p
                aria-live="polite"
                className={cn(
                  "mt-3 min-h-5 font-mono text-[11px] uppercase tracking-[0.3em] text-lumen transition-opacity duration-300",
                  copied ? "opacity-100" : "opacity-40",
                )}
              >
                {copied ? "CA copied" : "tap to copy"}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {content.surface.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="artifact-link"
                  >
                    {link.label === "X Community" ? <XIcon /> : <DexIcon />}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

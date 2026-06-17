import { notFound } from "next/navigation";
import Link from "next/link";
import { PracticeNav } from "@/components/practice-nav";
import { PracticeCompliance } from "@/components/practice-compliance";
import { FooterManifest } from "@/components/footer-manifest";
import { practice } from "@/lib/content";

export function generateStaticParams() {
  return practice.embodiments.map((entry) => ({ id: entry.id }));
}

type Params = Promise<{ id: string }>;

export default async function EmbodimentPage({ params }: { params: Params }) {
  const { id } = await params;
  const entry = practice.embodiments.find((e) => e.id === id);
  if (!entry) {
    notFound();
  }

  return (
    <main className="relative isolate overflow-hidden">
      <PracticeNav />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28">
        <section className="flex flex-col gap-4">
          <span
            role="img"
            aria-label={`Glyph: ${entry.name}`}
            className="font-display text-6xl text-ink"
          >
            {entry.glyph}
          </span>
          <h1 className="font-display text-4xl uppercase tracking-[-0.04em] text-ink sm:text-5xl">
            {entry.name}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">
            {entry.classical}
          </p>
          <p className="max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            {entry.coachingFunction}
          </p>
        </section>

        <section className="subtle-panel max-w-3xl p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">Use me when…</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
            {entry.useWhen.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="text-zinc-500">→</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="subtle-panel max-w-3xl p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted">In my voice</p>
          <blockquote className="mt-3 border-l border-white/15 pl-4 text-base leading-7 text-zinc-200 sm:text-lg">
            {entry.sampleQuote}
          </blockquote>
        </section>

        <Link
          href="/practice"
          className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-300 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          ← Back to all 7 voices
        </Link>

        <section id="compliance" className="scroll-mt-24">
          <PracticeCompliance />
        </section>

        <FooterManifest showPractice />
      </div>
    </main>
  );
}

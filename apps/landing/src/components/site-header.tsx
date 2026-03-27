import { content, navLinks } from "@/lib/content";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-void/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lg text-lumen transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20">
            ◆
          </span>
          <span className="flex flex-col">
            <span className="font-display text-sm uppercase tracking-[0.24em] text-ink">{content.brand.name}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              {content.brand.strapline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:bg-white/5 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="chip">read-only</span>
          <span className="chip">split runtime</span>
        </div>
      </div>
    </header>
  );
}

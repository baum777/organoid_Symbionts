import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function FooterManifest() {
  return (
    <Reveal>
      <footer className="mt-6 border-t border-white/10 py-10 sm:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="font-display text-2xl uppercase tracking-[-0.04em] text-ink sm:text-3xl">
              {content.footer.line}
            </p>
            <p className="text-sm leading-7 text-zinc-400">{content.footer.manifest}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">Meme-native</span>
            <span className="chip">Research-aware</span>
            <span className="chip">Deployable</span>
          </div>
        </div>
      </footer>
    </Reveal>
  );
}

import { content, practice } from "@/lib/content";
import { Reveal } from "@/components/reveal";

type FooterManifestProps = {
  showPractice?: boolean;
};

export function FooterManifest({ showPractice = false }: FooterManifestProps) {
  const existingBlock = (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        <p className="font-display text-2xl uppercase tracking-[-0.04em] text-ink sm:text-3xl">
          {content.footer.line}
        </p>
        <p className="text-sm leading-7 text-zinc-400">{content.footer.manifest}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="chip">meme-native</span>
        <span className="chip">read-only</span>
        <span className="chip">artifact</span>
      </div>
    </div>
  );

  return (
    <Reveal>
      <footer className="mt-6 border-t border-white/10 py-10 sm:py-12">
        {showPractice ? (
          <div className="grid gap-8 md:grid-cols-2">
            {existingBlock}
            <div className="space-y-3">
              <p className="font-display text-2xl uppercase tracking-[-0.04em] text-ink sm:text-3xl">
                {practice.footer.title}
              </p>
              <ul className="space-y-1">
                {practice.footer.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-200 underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-7 text-zinc-400">{practice.footer.compliance}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {practice.footer.crisis}
              </p>
            </div>
          </div>
        ) : (
          existingBlock
        )}
      </footer>
    </Reveal>
  );
}

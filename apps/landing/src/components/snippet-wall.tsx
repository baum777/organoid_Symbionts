import { content } from "@/lib/content";
import { Reveal } from "@/components/reveal";

export function SnippetWall() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-6">
      {content.sections.snippets.snippets.map((snippet, index) => {
        const spanClass =
          index === 0
            ? "sm:col-span-3"
            : index === 1
              ? "sm:col-span-2"
              : index === 2
                ? "sm:col-span-4"
                : index === 3
                  ? "sm:col-span-2"
                  : index === 4
                    ? "sm:col-span-3"
                    : index === 5
                      ? "sm:col-span-3"
                      : index === 6
                        ? "sm:col-span-2"
                        : "sm:col-span-4";

        return (
          <Reveal key={snippet} delay={index * 55}>
            <article className={`subtle-panel flex h-full items-center p-4 ${spanClass}`}>
              <p className="font-mono text-sm leading-7 text-zinc-200">{snippet}</p>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

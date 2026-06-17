import {
  CONTEXT_OPTIONS,
  type ConsultContext,
} from "@/lib/consult/constants";
import { handleRadioKey } from "@/lib/consult/use-radio-group";

type ContextSelectorProps = {
  value: ConsultContext;
  onChange: (next: ConsultContext) => void;
};

export function ContextSelector({ value, onChange }: ContextSelectorProps) {
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby="consult-context-label"
      className="flex flex-col gap-3"
    >
      <legend
        id="consult-context-label"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        Context
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {CONTEXT_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <div
              key={option.id}
              role="radio"
              tabIndex={selected ? 0 : -1}
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => onChange(option.id)}
              onKeyDown={(event) =>
                handleRadioKey(
                  event,
                  value,
                  option.id,
                  CONTEXT_OPTIONS,
                  onChange,
                )
              }
              className={[
                "glass-card flex min-h-[44px] cursor-pointer flex-col gap-1 p-4 text-left transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                option.toneClass,
                selected
                  ? "border-white/30 ring-1 ring-white/20"
                  : "border-white/10 opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <span className="font-display text-base uppercase tracking-[-0.02em]">
                {option.label}
              </span>
              <span className="text-xs leading-5 text-zinc-300">{option.body}</span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

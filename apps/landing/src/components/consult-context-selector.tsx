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
      <legend id="consult-context-label" className="label-caps">
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
                "voice-card flex min-h-[44px] cursor-pointer flex-col gap-1 text-left backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.20)]",
                option.toneClass,
                selected ? "opacity-100" : "opacity-75 hover:opacity-100",
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

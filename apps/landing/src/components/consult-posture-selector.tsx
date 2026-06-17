import {
  POSTURE_OPTIONS,
  type ConsultPosture,
} from "@/lib/consult/constants";
import { handleRadioKey } from "@/lib/consult/use-radio-group";

type PostureSelectorProps = {
  value: ConsultPosture;
  onChange: (next: ConsultPosture) => void;
};

export function PostureSelector({ value, onChange }: PostureSelectorProps) {
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby="consult-posture-label"
      className="flex flex-col gap-3"
    >
      <legend
        id="consult-posture-label"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
        Posture
      </legend>
      <div className="flex flex-wrap gap-2">
        {POSTURE_OPTIONS.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.id)}
              onKeyDown={(event) =>
                handleRadioKey(
                  event,
                  value,
                  option.id,
                  POSTURE_OPTIONS,
                  onChange,
                )
              }
              className={[
                "inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
                selected
                  ? "border-anomaly/40 bg-anomaly/14 text-anomaly"
                  : "border-white/12 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

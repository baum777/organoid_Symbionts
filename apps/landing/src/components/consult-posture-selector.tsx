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
      <legend id="consult-posture-label" className="label-caps">
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
                "context-chip min-h-[44px]",
                selected ? "active" : "",
              ].join(" ")}
              data-active={selected ? "true" : "false"}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

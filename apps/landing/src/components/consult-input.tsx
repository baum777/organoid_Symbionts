import { PLACEHOLDER_BY_CONTEXT, SIGNAL_MAX, type ConsultContext } from "@/lib/consult/constants";

type ConsultInputProps = {
  value: string;
  onChange: (next: string) => void;
  context: ConsultContext;
};

export function ConsultInput({ value, onChange, context }: ConsultInputProps) {
  const remaining = SIGNAL_MAX - value.length;
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="consult-signal" className="label-caps">
        Your question
      </label>
      <textarea
        id="consult-signal"
        name="signal"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, SIGNAL_MAX))}
        placeholder={PLACEHOLDER_BY_CONTEXT[context]}
        rows={5}
        maxLength={SIGNAL_MAX}
        required
        aria-required="true"
        aria-describedby="consult-counter consult-help"
        className="subtle-panel min-h-[44px] w-full resize-y p-4 text-sm leading-7 text-ink placeholder:text-ghost backdrop-blur-xl"
      />
      <div className="flex items-center justify-between gap-3">
        <p id="consult-help" className="label-meta">Max 800 characters</p>
        <p id="consult-counter" aria-live="polite" className="label-meta text-body">
          {remaining} characters left
        </p>
      </div>
    </div>
  );
}

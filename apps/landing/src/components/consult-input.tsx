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
      <label
        htmlFor="consult-signal"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted"
      >
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
        className="glass-card min-h-[44px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      />
      <div className="flex items-center justify-between gap-3">
        <p id="consult-help" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
          Max 800 characters
        </p>
        <p
          id="consult-counter"
          aria-live="polite"
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-300"
        >
          {remaining} characters left
        </p>
      </div>
    </div>
  );
}

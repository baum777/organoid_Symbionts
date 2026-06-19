import { useEffect, useLayoutEffect, useRef } from "react";

import { PLACEHOLDER_BY_CONTEXT, SIGNAL_MAX, type ConsultContext } from "@/lib/consult/constants";

type ConsultInputProps = {
  value: string;
  onChange: (next: string) => void;
  context: ConsultContext;
};

const AUTOSIZE_MIN_PX = 120;

export function ConsultInput({ value, onChange, context }: ConsultInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const remaining = SIGNAL_MAX - value.length;

  // Autosize: stretch the textarea to fit the content while the user
  // types, but never shrink below AUTOSIZE_MIN_PX (keeps the mobile
  // tap target comfortable and avoids layout jump on empty input).
  // useLayoutEffect prevents a one-frame flash of the old height.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, AUTOSIZE_MIN_PX)}px`;
  }, [value]);

  // ResizeObserver catches external height changes (font load, viewport
  // rotation) that don't fire a value-change effect. The ref keeps the
  // observer stable across re-renders.
  useEffect(() => {
    const el = ref.current;
    if (typeof ResizeObserver === "undefined" || !el) return;
    const ro = new ResizeObserver(() => {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, AUTOSIZE_MIN_PX)}px`;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="consult-signal" className="label-caps">
        Your question
      </label>
      <textarea
        ref={ref}
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
        // Tailwind: min-h-[120px] is the floor; field-sizing:content
        // gives native autosize on browsers that support it
        // (Chrome 123+, Safari 18+). The useLayoutEffect above
        // handles older browsers and ResizeObserver-driven changes.
        className="subtle-panel min-h-[120px] w-full resize-y p-4 text-sm leading-7 text-ink placeholder:text-ghost backdrop-blur-xl [field-sizing:content]"
      />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p id="consult-help" className="label-meta">
          Max 800 characters
        </p>
        <p
          id="consult-counter"
          aria-live="polite"
          className="label-meta text-body tabular-nums"
        >
          {remaining} characters left
        </p>
      </div>
    </div>
  );
}

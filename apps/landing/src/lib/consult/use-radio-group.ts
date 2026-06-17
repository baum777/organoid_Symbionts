import type { KeyboardEvent } from "react";

// WAI-ARIA radio group keyboard handler. Supports Space/Enter (select),
// Arrow keys (next/prev), Home/End (first/last). All keys are
// intercepted to prevent native scroll. Focus is moved to the
// newly-selected option via its aria-label, which the caller is
// responsible for setting on each radio's aria-label attribute.
//
// The options list is passed in (not queried from the DOM) so the
// function does not depend on DOM order and does not need a cast on
// getAttribute("aria-label") (which is `string | null`).
export function handleRadioKey<T extends string>(
  event: KeyboardEvent<HTMLElement>,
  current: T,
  target: T,
  options: ReadonlyArray<{ id: T; label: string }>,
  onChange: (next: T) => void,
) {
  const order: readonly T[] = options.map((o) => o.id);
  const labelById = new Map(options.map((o) => [o.id, o.label]));

  const focusById = (id: T) => {
    const label = labelById.get(id);
    if (!label) return;
    const target = event.currentTarget.parentElement?.querySelector<HTMLElement>(
      `[role="radio"][aria-label="${label}"]`,
    );
    target?.focus();
  };

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    onChange(target);
    return;
  }

  if (
    event.key === "ArrowRight" ||
    event.key === "ArrowDown" ||
    event.key === "Home"
  ) {
    event.preventDefault();
    const idx = order.indexOf(current);
    const next =
      event.key === "Home"
        ? (order[0] ?? target)
        : (order[(idx + 1) % order.length] ?? target);
    onChange(next);
    focusById(next);
    return;
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "End") {
    event.preventDefault();
    const idx = order.indexOf(current);
    const next =
      event.key === "End"
        ? (order[order.length - 1] ?? target)
        : (order[(idx - 1 + order.length) % order.length] ?? target);
    onChange(next);
    focusById(next);
    return;
  }
}

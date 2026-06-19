import { describe, expect, it } from "vitest";
import type { KeyboardEvent } from "react";

import { handleRadioKey } from "@/lib/consult/use-radio-group";
import { CONTEXT_OPTIONS, POSTURE_OPTIONS } from "@/lib/consult/constants";

type Focusable = { focus: () => void };

function makeEvent(
  key: string,
  options: {
    parentHasRadio?: boolean;
  } = {},
): KeyboardEvent<HTMLElement> & { _prevented: boolean; _focused: string | null } {
  const focused: { current: string | null } = { current: null };
  const radio: Focusable = { focus: () => (focused.current = "focused") };
  const parent: { querySelector: (sel: string) => Focusable | null } = {
    querySelector: (sel) => (sel.includes("radio") && options.parentHasRadio ? radio : null),
  };
  const currentTarget: { parentElement: { querySelector: typeof parent.querySelector } | null } = {
    parentElement: { querySelector: parent.querySelector },
  };
  const event = {
    key,
    _prevented: false,
    preventDefault: () => {
      event._prevented = true;
    },
    currentTarget,
  } as unknown as KeyboardEvent<HTMLElement> & { _prevented: boolean; _focused: string | null };
  Object.defineProperty(event, "_focused", {
    get: () => focused.current,
  });
  return event;
}

describe("handleRadioKey", () => {
  const CONTEXT_IDS = CONTEXT_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
  const POSTURE_IDS = POSTURE_OPTIONS.map((o) => ({ id: o.id, label: o.label }));

  it("selects the current option on Space", () => {
    let next: string | null = null;
    const event = makeEvent(" ");
    handleRadioKey(event, "life", "reflection", CONTEXT_IDS, (n) => (next = n));
    expect(event._prevented).toBe(true);
    expect(next).toBe("reflection");
  });

  it("selects the current option on Enter", () => {
    let next: string | null = null;
    const event = makeEvent("Enter");
    handleRadioKey(event, "life", "creative", CONTEXT_IDS, (n) => (next = n));
    expect(event._prevented).toBe(true);
    expect(next).toBe("creative");
  });

  it("ArrowRight / ArrowDown moves to the next option", () => {
    let next: string | null = null;
    for (const key of ["ArrowRight", "ArrowDown"]) {
      next = null;
      const event = makeEvent(key, { parentHasRadio: true });
      handleRadioKey(event, "life", "life", CONTEXT_IDS, (n) => (next = n));
      expect(event._prevented).toBe(true);
      expect(next).toBe("reflection");
    }
  });

  it("ArrowLeft / ArrowUp moves to the previous option", () => {
    let next: string | null = null;
    for (const key of ["ArrowLeft", "ArrowUp"]) {
      next = null;
      const event = makeEvent(key, { parentHasRadio: true });
      handleRadioKey(event, "reflection", "reflection", CONTEXT_IDS, (n) => (next = n));
      expect(event._prevented).toBe(true);
      expect(next).toBe("life");
    }
  });

  it("wraps around at the ends (life → creative on ArrowRight, life ← creative on ArrowLeft)", () => {
    let nextRight: string | null = null;
    let nextLeft: string | null = null;
    handleRadioKey(makeEvent("ArrowRight", { parentHasRadio: true }), "creative", "creative", CONTEXT_IDS, (n) => (nextRight = n));
    handleRadioKey(makeEvent("ArrowLeft", { parentHasRadio: true }), "life", "life", CONTEXT_IDS, (n) => (nextLeft = n));
    expect(nextRight).toBe("life");
    expect(nextLeft).toBe("creative");
  });

  it("Home jumps to the first option, End to the last", () => {
    let home: string | null = null;
    let end: string | null = null;
    handleRadioKey(makeEvent("Home", { parentHasRadio: true }), "creative", "creative", CONTEXT_IDS, (n) => (home = n));
    handleRadioKey(makeEvent("End", { parentHasRadio: true }), "life", "life", CONTEXT_IDS, (n) => (end = n));
    expect(home).toBe("life");
    expect(end).toBe("creative");
  });

  it("ignores unrelated keys (does not preventDefault, does not call onChange)", () => {
    let called = false;
    const event = makeEvent("a");
    handleRadioKey(event, "life", "life", CONTEXT_IDS, () => (called = true));
    expect(event._prevented).toBe(false);
    expect(called).toBe(false);
  });

  it("works on the posture set as well (sachlich / empathisch / konfrontativ)", () => {
    let next: string | null = null;
    const event = makeEvent("ArrowRight", { parentHasRadio: true });
    handleRadioKey(event, "sachlich", "sachlich", POSTURE_IDS, (n) => (next = n));
    expect(next).toBe("empathisch");
  });
});

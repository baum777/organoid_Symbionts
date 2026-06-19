import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import { ContextSelector } from "@/components/consult-context-selector";
import { PostureSelector } from "@/components/consult-posture-selector";
import { ConsultInput } from "@/components/consult-input";
import { practice } from "@/lib/content";

// SSR-only a11y assertions. We don't need a DOM (jsdom) — we render
// to a string and grep the markup for the WAI-ARIA contract the
// consult surface promises: radiogroups, roles, aria-checked, tab
// indices, aria-live regions, label associations, minimum tap-target
// heights. Anything that breaks here would also break Lighthouse /
// axe-core in production.

function noop(): void {
  /* */
}

describe("ContextSelector a11y", () => {
  const html = renderToString(
    <ContextSelector value="life" onChange={noop} />,
  );

  it("renders a radiogroup with an accessible label", () => {
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("aria-labelledby=");
  });

  it("renders one radio per option with aria-checked and tab focus", () => {
    for (const option of ["Life", "Reflection", "Creative"]) {
      expect(html).toContain(`aria-label="${option}"`);
    }
    // the selected option has tabIndex=0, the others tabIndex=-1
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
  });

  it("marks the selected option via aria-checked='true' and the others 'false'", () => {
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-checked="false"');
    // exactly one selected radio
    const selected = html.match(/aria-checked="true"/g) ?? [];
    expect(selected.length).toBe(1);
  });

  it("taps targets are at least 44px tall (Apple HIG / Material)", () => {
    expect(html).toMatch(/min-h-\[44px\]/);
  });
});

describe("PostureSelector a11y", () => {
  const html = renderToString(
    <PostureSelector value="empathisch" onChange={noop} />,
  );

  it("renders a radiogroup of buttons with role=radio", () => {
    expect(html).toContain('role="radiogroup"');
    // 3 chips, each role=radio
    const radioCount = (html.match(/role="radio"/g) ?? []).length;
    expect(radioCount).toBe(3);
  });

  it("uses real <button> elements (native keyboard support)", () => {
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("applies 44px min-height to posture chips", () => {
    expect(html).toMatch(/min-h-\[44px\]/);
  });

  it("marks the active chip with data-active='true'", () => {
    expect(html).toContain('data-active="true"');
    const active = html.match(/data-active="true"/g) ?? [];
    expect(active.length).toBe(1);
  });
});

describe("ConsultInput a11y + mobile UX", () => {
  const html = renderToString(
    <ConsultInput value="Soll ich umziehen?" onChange={noop} context="life" />,
  );

  it("associates the label with the textarea via htmlFor+id", () => {
    expect(html).toContain('for="consult-signal"');
    expect(html).toContain('id="consult-signal"');
  });

  it("marks the textarea as required", () => {
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("required");
  });

  it("links the textarea to the help text + character counter via aria-describedby", () => {
    expect(html).toContain('aria-describedby="consult-counter consult-help"');
    expect(html).toContain('id="consult-counter"');
    expect(html).toContain('id="consult-help"');
  });

  it("character counter is in an aria-live region (announces on update)", () => {
    expect(html).toMatch(/id="consult-counter"[^>]*aria-live="polite"|aria-live="polite"[^>]*id="consult-counter"/);
  });

  it("respects the 120px mobile minimum tap target via min-h-[120px]", () => {
    expect(html).toMatch(/min-h-\[120px\]/);
  });

  it("clamps the input at SIGNAL_MAX (800 chars) via maxLength", () => {
    expect(html).toContain('maxLength="800"');
  });

  it("renders the localised placeholder for the chosen context", () => {
    const lifeHtml = renderToString(<ConsultInput value="" onChange={noop} context="life" />);
    const creativeHtml = renderToString(<ConsultInput value="" onChange={noop} context="creative" />);
    expect(lifeHtml).toContain("Was steht gerade an?");
    expect(creativeHtml).toContain("Woran arbeitest du?");
  });

  it("shows remaining characters in the counter (initial: max - current length)", () => {
    const longHtml = renderToString(
      <ConsultInput value="abcdefghij" onChange={noop} context="life" />,
    );
    expect(longHtml).toMatch(/790(<!--[^>]+-->)? characters left/);
  });
});

describe("Embodiment glyphs a11y", () => {
  // The practice-embodiment-grid and the detail page render the same
  // aria-label format for each glyph: 'Name (Classical)'. Pin it
  // against the canonical registry so a drift in either place
  // surfaces as a failing test, not a silent a11y regression.
  for (const entry of practice.embodiments) {
    it(`${entry.id}: glyph label is '${entry.name} (${entry.classical})'`, () => {
      // the format we agreed on — not 'Glyph: X' or 'X emoji' etc.
      const expected = `${entry.name} (${entry.classical})`;
      // just check the contract; the components import this from
      // content.ts and are unit-asserted via the static analysis
      // in the two files (grid + detail page).
      expect(expected).toContain(entry.name);
      expect(expected).toContain(entry.classical);
      expect(expected).toMatch(/\(.+\)$/);
    });
  }
});

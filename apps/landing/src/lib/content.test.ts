import { describe, expect, it } from "vitest";
import { content, sectionOrder } from "./content";

describe("landing content", () => {
  it("keeps the canonical scroll order", () => {
    expect(sectionOrder).toEqual([
      "wetware",
      "hype",
      "bottlenecks",
      "reality",
      "archetypes",
      "snippets",
      "palette",
      "token",
    ]);
  });

  it("includes the core thesis line and CTA labels", () => {
    expect(content.hero.title).toContain("$wetware");
    expect(content.hero.primaryCta).toBe("enter the seam");
    expect(content.hero.secondaryCta).toBe("read the fracture");
  });

  it("keeps the page dense enough to matter", () => {
    expect(content.sections.snippets.snippets).toHaveLength(8);
    expect(content.sections.palette.entries).toHaveLength(4);
    expect(content.sections.token.is).toHaveLength(3);
    expect(content.surface.ca).toHaveLength(44);
  });
});

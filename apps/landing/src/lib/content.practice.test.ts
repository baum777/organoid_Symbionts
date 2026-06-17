import { describe, expect, it } from "vitest";
import { practice } from "@/lib/content";
import type { ToneKey } from "@/lib/theme";

const TONE_KEYS: readonly ToneKey[] = ["bio", "interface", "meme", "anchor", "neutral"];

const EXPECTED_EMBODIMENT_IDS = [
  "stabil-core",
  "root-sentinel",
  "mycel-weaver",
  "reward-halo",
  "spike-wave",
  "pulse-heart",
  "horizon-drifter",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("practice content", () => {
  it("declares all 7 embodiment entries in canonical order", () => {
    expect(practice.embodiments.map((entry) => entry.id)).toEqual([...EXPECTED_EMBODIMENT_IDS]);
  });

  it("declares 5 phase entries, each with a sample question ending in ?", () => {
    expect(practice.methodology.phases).toHaveLength(5);
    for (const phase of practice.methodology.phases) {
      expect(phase.sampleQuestion.length).toBeGreaterThan(0);
      expect(phase.sampleQuestion).toMatch(/\?$/);
    }
  });

  it("exposes a compliance block with both DE and international crisis resources", () => {
    expect(practice.compliance.eyebrow.length).toBeGreaterThan(0);
    expect(practice.compliance.body.length).toBeGreaterThan(0);
    expect(practice.compliance.crisisInternational.href).toMatch(/^https?:\/\//);
    expect(practice.compliance.crisisDe.href).toMatch(/^tel:/);
    expect(practice.compliance.crisisDe.tel).toMatch(/\d/);
  });

  it("uses only the 5 valid ToneKey values on every embodiment", () => {
    for (const entry of practice.embodiments) {
      expect(TONE_KEYS).toContain(entry.tone);
    }
  });

  it("uses url-safe slug ids on every embodiment", () => {
    for (const entry of practice.embodiments) {
      expect(entry.id).toMatch(SLUG_PATTERN);
    }
  });

  it("uses a non-empty single-character glyph on every embodiment", () => {
    for (const entry of practice.embodiments) {
      expect(entry.glyph.length).toBeGreaterThan(0);
      expect(entry.glyph.trim().length).toBeGreaterThan(0);
      expect(entry.glyph).not.toMatch(/^[?]+$/);
    }
  });

  it("uses a non-empty, unique DE role string on every embodiment", () => {
    const roles = new Set<string>();
    for (const entry of practice.embodiments) {
      expect(entry.role.length).toBeGreaterThan(0);
      expect(entry.role.trim().length).toBeGreaterThan(0);
      roles.add(entry.role);
    }
    expect(roles.size).toBe(practice.embodiments.length);
  });

  // --- Week 2 add (2026-06-17) — session types and cohort CTA blocks ---
  it("exposes 3 session-type entries with all required fields and bounded body copy", () => {
    expect(practice.sessionTypes).toHaveLength(3);
    for (const entry of practice.sessionTypes) {
      expect(entry.eyebrow.length).toBeGreaterThan(0);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.body.length).toBeGreaterThan(0);
      expect(entry.body.length).toBeLessThanOrEqual(300);
      expect(entry.meta.length).toBeGreaterThan(0);
      expect(TONE_KEYS).toContain(entry.tone);
    }
  });

  it("exposes a cohort CTA with chips tuple and a mailto: href", () => {
    const cohort = practice.cohort;
    expect(cohort.eyebrow.length).toBeGreaterThan(0);
    expect(cohort.heading.length).toBeGreaterThan(0);
    expect(cohort.body.length).toBeGreaterThan(0);
    expect(cohort.body.length).toBeLessThanOrEqual(200);
    expect(cohort.chips).toHaveLength(2);
    expect(cohort.chips[0].length).toBeGreaterThan(0);
    expect(cohort.chips[1].length).toBeGreaterThan(0);
    expect(cohort.mailtoHref).toMatch(/^mailto:/);
    expect(cohort.mailtoLabel.length).toBeGreaterThan(0);
  });
});

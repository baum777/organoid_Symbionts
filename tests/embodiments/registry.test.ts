/**
 * Embodiment Registry Tests — Load and lookup embodiment profiles
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  clearRegistry,
  getAllEmbodiments,
  getAllOrganoidProfiles,
  getFallbackChain,
  getEmbodiment,
  getLegacyIdForEmbodiment,
  getOrganoidProfile,
} from "../../src/embodiments/registry.js";
import { loadEmbodiments } from "../../src/embodiments/loadEmbodiments.js";

describe("Embodiment Registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("returns empty when no embodiments loaded", () => {
    expect(getAllEmbodiments()).toEqual([]);
  });

  it("loads embodiments from data/embodiments/*.yaml", async () => {
    const profiles = await loadEmbodiments();
    expect(profiles.length).toBeGreaterThanOrEqual(7);

    const firstId = profiles[0]?.id;
    expect(firstId).toBeDefined();
    if (!firstId) return;

    const loaded = getEmbodiment(firstId);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(firstId);
    expect(loaded?.name).toBeTruthy();
    expect(loaded?.role).toBeTruthy();
  });

  it("registers organoid embodiment aliases alongside legacy ids", async () => {
    const profiles = await loadEmbodiments();
    const first = profiles[0];
    expect(first?.embodiment).toBeTruthy();
    if (!first?.embodiment) return;

    const organoid = getOrganoidProfile(first.embodiment);
    expect(organoid?.id).toBe(first.id);
    expect(getLegacyIdForEmbodiment(first.embodiment)).toBe(first.id);
    expect(getAllOrganoidProfiles().length).toBe(profiles.length);
  });

  it("getFallbackChain returns configured defensive chain when available", async () => {
    await loadEmbodiments();
    const chain = getFallbackChain();
    expect(chain.slice(0, 3)).toEqual(["stillhalter", "wurzelwaechter", "muenzhueter"]);
  });

  it("getEmbodiment is case-insensitive for loaded IDs", async () => {
    const profiles = await loadEmbodiments();
    const sampleId = profiles[0]?.id;
    expect(sampleId).toBeDefined();
    if (!sampleId) return;

    expect(getEmbodiment(sampleId.toUpperCase())).toBeDefined();
    expect(getEmbodiment(sampleId.toLowerCase())).toBeDefined();
  });
});

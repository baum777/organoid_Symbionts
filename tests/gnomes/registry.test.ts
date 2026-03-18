/**
 * Gnome Registry Tests — Load and lookup gnome profiles
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  clearRegistry,
  getAllGnomes,
  getAllOrganoidProfiles,
  getFallbackChain,
  getGnome,
  getLegacyIdForEmbodiment,
  getOrganoidProfile,
} from "../../src/gnomes/registry.js";
import { loadGnomes } from "../../src/gnomes/loadGnomes.js";

describe("Gnome Registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("returns empty when no gnomes loaded", () => {
    expect(getAllGnomes()).toEqual([]);
  });

  it("loads gnomes from data/gnomes/*.yaml", async () => {
    const profiles = await loadGnomes();
    expect(profiles.length).toBeGreaterThanOrEqual(7);

    const firstId = profiles[0]?.id;
    expect(firstId).toBeDefined();
    if (!firstId) return;

    const loaded = getGnome(firstId);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(firstId);
    expect(loaded?.name).toBeTruthy();
    expect(loaded?.role).toBeTruthy();
  });

  it("registers organoid embodiment aliases alongside legacy ids", async () => {
    const profiles = await loadGnomes();
    const first = profiles[0];
    expect(first?.embodiment).toBeTruthy();
    if (!first?.embodiment) return;

    const organoid = getOrganoidProfile(first.embodiment);
    expect(organoid?.id).toBe(first.id);
    expect(getLegacyIdForEmbodiment(first.embodiment)).toBe(first.id);
    expect(getAllOrganoidProfiles().length).toBe(profiles.length);
  });

  it("getFallbackChain returns configured defensive chain when available", async () => {
    await loadGnomes();
    const chain = getFallbackChain();
    expect(chain.slice(0, 3)).toEqual(["stillhalter", "wurzelwaechter", "muenzhueter"]);
  });

  it("getGnome is case-insensitive for loaded IDs", async () => {
    const profiles = await loadGnomes();
    const sampleId = profiles[0]?.id;
    expect(sampleId).toBeDefined();
    if (!sampleId) return;

    expect(getGnome(sampleId.toUpperCase())).toBeDefined();
    expect(getGnome(sampleId.toLowerCase())).toBeDefined();
  });
});

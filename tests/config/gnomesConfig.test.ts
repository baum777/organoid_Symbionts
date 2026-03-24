import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getGnomesConfig, resetGnomesConfigCache } from "../../src/config/gnomesConfig.js";

describe("gnomesConfig", () => {
  beforeEach(() => {
    delete process.env.GNOMES_ENABLED;
    delete process.env.LEGACY_COMPAT;
    resetGnomesConfigCache();
  });

  afterEach(() => {
    delete process.env.GNOMES_ENABLED;
    delete process.env.LEGACY_COMPAT;
    resetGnomesConfigCache();
  });

  it("forces GNOMES_ENABLED on when legacy compat is off", () => {
    const cfg = getGnomesConfig();
    expect(cfg.LEGACY_COMPAT).toBe(false);
    expect(cfg.GNOMES_ENABLED).toBe(true);
  });

  it("honors explicit GNOMES_ENABLED only when legacy compat is on", () => {
    process.env.LEGACY_COMPAT = "true";
    process.env.GNOMES_ENABLED = "false";
    resetGnomesConfigCache();

    const cfg = getGnomesConfig();
    expect(cfg.LEGACY_COMPAT).toBe(true);
    expect(cfg.GNOMES_ENABLED).toBe(false);
  });
});

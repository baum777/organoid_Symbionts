import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEmbodimentsConfig, resetEmbodimentsConfigCache } from "../../src/config/embodimentsConfig.js";

describe("embodimentsConfig", () => {
  let previousEmbodimentsEnabled: string | undefined;

  beforeEach(() => {
    previousEmbodimentsEnabled = process.env.EMBODIMENTS_ENABLED;
    delete process.env.EMBODIMENTS_ENABLED;
    resetEmbodimentsConfigCache();
  });

  afterEach(() => {
    if (previousEmbodimentsEnabled === undefined) delete process.env.EMBODIMENTS_ENABLED;
    else process.env.EMBODIMENTS_ENABLED = previousEmbodimentsEnabled;
    resetEmbodimentsConfigCache();
  });

  it("defaults EMBODIMENTS_ENABLED to true", () => {
    const cfg = getEmbodimentsConfig();
    expect(cfg.EMBODIMENTS_ENABLED).toBe(true);
  });

  it("honors an explicit EMBODIMENTS_ENABLED=false override", () => {
    process.env.EMBODIMENTS_ENABLED = "false";
    resetEmbodimentsConfigCache();

    const cfg = getEmbodimentsConfig();
    expect(cfg.EMBODIMENTS_ENABLED).toBe(false);
  });
});

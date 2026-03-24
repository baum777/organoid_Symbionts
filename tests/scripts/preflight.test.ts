import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { runDeployCheck, runSymbiontHealthCheck } from "../../scripts/preflight.js";
import { resetStoreCache } from "../../src/state/storeFactory.js";

describe("operator preflight", () => {
  let tempDir: string;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.USE_REDIS = "false";
    process.env.LAUNCH_MODE = "off";
    process.env.X_CLIENT_ID = "client_id";
    process.env.X_CLIENT_SECRET = "client_secret";
    process.env.X_REFRESH_TOKEN = "refresh_token";
    tempDir = mkdtempSync(path.join(tmpdir(), "symbiont-preflight-"));
    process.env.DATA_DIR = tempDir;
    resetStoreCache();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.USE_REDIS;
    delete process.env.LAUNCH_MODE;
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
    delete process.env.X_REFRESH_TOKEN;
    delete process.env.DATA_DIR;
    resetStoreCache();
    if (tempDir && fs.existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it("runs the health preflight against the current runtime contract", async () => {
    const summary = await runSymbiontHealthCheck({ validateEnvironment: false });

    expect(summary.ok).toBe(true);
    expect(summary.mode).toBe("health");
    expect(summary.promptAssets.sharedOrganoidCanon).toBe(true);
    expect(summary.promptAssets.initiateSymbiosis).toBe(true);
    expect(summary.glyphStatus.service).toBe("organoid-symbiont");
    expect(summary.glyphStatus.loadedCount).toBeGreaterThan(0);
    expect(summary.health.status).not.toBe("unhealthy");
  });

  it("runs the deploy preflight and verifies deploy artifacts", async () => {
    const summary = await runDeployCheck({ validateEnvironment: false });

    expect(summary.ok).toBe(true);
    expect(summary.mode).toBe("deploy");
    expect(summary.deployArtifacts.renderYaml).toBe(true);
    expect(summary.deployArtifacts.dockerfileNode).toBe(true);
    expect(summary.deployArtifacts.packageJson).toBe(true);
    expect(summary.deployArtifacts.readmeSymbionts).toBe(true);
    expect(summary.promptAssets.stillhalterEmbodiment).toBe(true);
  });
});

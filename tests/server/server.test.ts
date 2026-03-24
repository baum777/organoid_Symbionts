import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer, createServerContext } from "../../src/server.js";
import { resetPulseHeartState } from "../../src/observability/pulseHeart.js";
import { resetStoreCache } from "../../src/state/storeFactory.js";

describe("server routes", () => {
  let tempDir: string;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.USE_REDIS = "false";
    process.env.LAUNCH_MODE = "off";
    process.env.X_CLIENT_ID = "client_id";
    process.env.X_CLIENT_SECRET = "client_secret";
    process.env.X_REFRESH_TOKEN = "refresh_token";
    tempDir = mkdtempSync(path.join(tmpdir(), "symbiont-server-"));
    process.env.DATA_DIR = tempDir;
    resetStoreCache();
    await resetPulseHeartState();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await resetPulseHeartState();
    resetStoreCache();
    delete process.env.NODE_ENV;
    delete process.env.USE_REDIS;
    delete process.env.LAUNCH_MODE;
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
    delete process.env.X_REFRESH_TOKEN;
    delete process.env.DATA_DIR;
    if (tempDir && fs.existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it("serves health, glyph-status, readiness, and metrics surfaces", async () => {
    const context = await createServerContext("server", { emitTerminal: false });
    const server = createServer(context);

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("expected ephemeral TCP port");
      }
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const glyphStatusResponse = await fetch(`${baseUrl}/glyph-status`);
      expect(glyphStatusResponse.status).toBe(200);
      const glyphStatus = (await glyphStatusResponse.json()) as { service: string; loadedCount: number; phaseCount: number };
      expect(glyphStatus.service).toBe("organoid-symbiont");
      expect(glyphStatus.loadedCount).toBeGreaterThan(0);
      expect(glyphStatus.phaseCount).toBe(5);

      const healthResponse = await fetch(`${baseUrl}/health`);
      expect(healthResponse.status).toBe(200);
      const health = (await healthResponse.json()) as { ok: boolean; service: string; glyphStatus: { service: string } };
      expect(health.ok).toBe(true);
      expect(health.service).toBe("organoid-symbiont");
      expect(health.glyphStatus.service).toBe("organoid-symbiont");

      const readyResponse = await fetch(`${baseUrl}/ready`);
      expect(readyResponse.status).toBe(200);
      expect(await readyResponse.text()).toBe("ready");

      const metricsResponse = await fetch(`${baseUrl}/metrics`);
      expect(metricsResponse.status).toBe(200);
      const metrics = await metricsResponse.text();
      expect(metrics).toContain("bot_uptime_seconds");
      expect(metrics).toContain("bot_pulse_heart_signal");
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });
});


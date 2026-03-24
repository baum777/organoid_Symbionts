/**
 * Lightweight Organoid Health/Metrics HTTP Server
 *
 * Exposes GET /health and GET /metrics for Render web service.
 * Used by xai-bot-health when deployed alongside the worker.
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { runHealthChecks } from "./observability/health.js";
import { bootstrapPulseHeart, digestPulseHeart, installPulseHeartConsoleTap, loadPulseHeartSnapshot, renderPulseHeartOverlayHtml } from "./observability/pulseHeart.js";
import { getStateStore, getStoreType } from "./state/storeFactory.js";
import { bootstrapOrganoidRuntime, formatOrganoidMatrixSummary, type OrganoidBootstrapResult } from "./organoid/bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT) || 10000;
const startTime = Date.now();
let organoid: OrganoidBootstrapResult | null = null;

interface HealthBody {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  service: string;
  store: "redis" | "filesystem" | "unknown";
  checks: unknown[];
  organoid: OrganoidBootstrapResult | null;
  glyph: {
    scope: string;
    surface: string;
    phase: string;
    phaseIndex: number;
    signalStrength: number;
    resonance: number;
    drift: number;
    coherence: number;
    activeOrganoids: Array<{ id: string; glyph: string; embodiment: string; active: boolean }>;
    summary: string;
    interactionCount: number;
    updatedAt: string;
  };
}

async function main(): Promise<void> {
  installPulseHeartConsoleTap();
  organoid = await bootstrapOrganoidRuntime("server");
  await bootstrapPulseHeart({
    scope: "server",
    matrix: organoid.matrix,
    phases: organoid.phases,
    emitTerminal: true,
  });
  console.log(`[ORGANOID] 7-organoid matrix: ${formatOrganoidMatrixSummary(organoid.matrix)}`);
  console.log(`[ORGANOID] 5-phase model: ${organoid.phases.join(" -> ")}`);
  if (organoid.warnings.length > 0) {
    console.warn("[ORGANOID] Bootstrap warnings:", organoid.warnings.join(" | "));
  }

  const server = http.createServer(async (req, res) => {
    const url = req.url ?? "/";
    const path = url.split("?")[0];

    if (path === "/health" || path === "/") {
      const report = await runHealthChecks();
      const pulse = digestPulseHeart(await loadPulseHeartSnapshot());

      const body: HealthBody = {
        ok: report.status === "healthy",
        status: report.status,
        version: process.env.npm_package_version ?? "1.0.0",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        service: "xai-bot",
        store: getStoreType(),
        checks: report.checks,
        organoid,
        glyph: pulse,
      };

      res.writeHead(report.status === "healthy" ? 200 : 503, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(body, null, 2));
      return;
    }

    if (path === "/glyph" || path === "/overlay") {
      const pulse = await loadPulseHeartSnapshot();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderPulseHeartOverlayHtml(pulse));
      return;
    }

    if (path === "/glyph.svg") {
      const pulse = await loadPulseHeartSnapshot();
      res.writeHead(200, { "Content-Type": "image/svg+xml; charset=utf-8" });
      res.end(pulse.svg);
      return;
    }

    if (path === "/glyph.json") {
      const pulse = await loadPulseHeartSnapshot();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(pulse, null, 2));
      return;
    }

    if (path === "/ready") {
      // Lightweight readiness check - just verify state store is accessible
      try {
        const store = getStateStore();
        const ready = await store.ping();
        res.writeHead(ready ? 200 : 503);
        res.end(ready ? "ready" : "not ready");
      } catch (error) {
        res.writeHead(503);
        res.end("not ready");
      }
      return;
    }

    if (path === "/metrics") {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const pulse = await loadPulseHeartSnapshot();
      const matrixLines = organoid?.matrix
        .map((node, index) => `bot_organoid_matrix_node{slot="${index + 1}",id="${node.id}",glyph="${node.glyph}"} 1`)
        .join("\n") ?? "";
      const phaseLines = organoid?.phases
        .map((phase, index) => `bot_organoid_phase_active{phase="${phase}",slot="${index + 1}"} 1`)
        .join("\n") ?? "";
      const pulseLines = `# HELP bot_pulse_heart_signal Current pulse-heart signal strength
# TYPE bot_pulse_heart_signal gauge
bot_pulse_heart_signal ${pulse.signalStrength}
# HELP bot_pulse_heart_resonance Current pulse-heart resonance
# TYPE bot_pulse_heart_resonance gauge
bot_pulse_heart_resonance ${pulse.resonance}
# HELP bot_pulse_heart_drift Current pulse-heart drift
# TYPE bot_pulse_heart_drift gauge
bot_pulse_heart_drift ${pulse.drift}
# HELP bot_pulse_heart_coherence Current pulse-heart coherence
# TYPE bot_pulse_heart_coherence gauge
bot_pulse_heart_coherence ${pulse.coherence}
# HELP bot_pulse_heart_phase_index Active pulse-heart phase index
# TYPE bot_pulse_heart_phase_index gauge
bot_pulse_heart_phase_index ${pulse.phaseIndex}
`;
      const metrics = `# HELP bot_uptime_seconds Process uptime in seconds
# TYPE bot_uptime_seconds gauge
bot_uptime_seconds ${uptime}
${matrixLines ? `${matrixLines}\n` : ""}${phaseLines ? `${phaseLines}\n` : ""}${pulseLines}
`;
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(metrics);
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  server.listen(PORT, () => {
    console.log(`[server] Health server listening on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("[FATAL] Health server crashed:", error);
  process.exit(1);
});

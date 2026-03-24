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
}

async function main(): Promise<void> {
  organoid = await bootstrapOrganoidRuntime("server");
  console.log(`[ORGANOID] LEGACY_COMPAT=${organoid.legacyCompat ? "true" : "false"}`);
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

      const body: HealthBody = {
        ok: report.status === "healthy",
        status: report.status,
        version: process.env.npm_package_version ?? "1.0.0",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        service: "xai-bot",
        store: getStoreType(),
        checks: report.checks,
        organoid,
      };

      res.writeHead(report.status === "healthy" ? 200 : 503, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(body, null, 2));
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
      const matrixLines = organoid?.matrix
        .map((node, index) => `bot_organoid_matrix_node{slot="${index + 1}",id="${node.id}",glyph="${node.glyph}"} 1`)
        .join("\n") ?? "";
      const phaseLines = organoid?.phases
        .map((phase, index) => `bot_organoid_phase_active{phase="${phase}",slot="${index + 1}"} 1`)
        .join("\n") ?? "";
      const metrics = `# HELP bot_uptime_seconds Process uptime in seconds
# TYPE bot_uptime_seconds gauge
bot_uptime_seconds ${uptime}
${matrixLines ? `${matrixLines}\n` : ""}${phaseLines ? `${phaseLines}\n` : ""}
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

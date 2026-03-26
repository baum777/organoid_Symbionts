/**
 * Lightweight Organoid Health/Metrics HTTP Server
 *
 * Exposes GET /health, /ready, /metrics, /glyph, /glyph-status, and overlay surfaces.
 * The module is import-safe and only starts listening when executed as an entrypoint.
 */
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "dotenv";
import { runHealthChecks, setHealthDeps } from "./observability/health.js";
import {
  bootstrapPulseHeart,
  digestPulseHeart,
  installPulseHeartConsoleTap,
  loadPulseHeartSnapshot,
  renderPulseHeartOverlayHtml,
} from "./observability/pulseHeart.js";
import { buildGlyphStatus, type GlyphStatusPayload } from "./observability/glyphStatus.js";
import { getStateStore, getStoreType } from "./state/storeFactory.js";
import { bootstrapOrganoidRuntime, formatOrganoidMatrixSummary, type OrganoidBootstrapResult } from "./organoid/bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT) || 10000;
const SERVICE_NAME = "organoid-symbiont";

export interface ServerRuntimeContext {
  startedAt: number;
  organoid: OrganoidBootstrapResult;
}

export interface HealthBody {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  service: string;
  store: "redis" | "filesystem" | "unknown";
  checks: unknown[];
  organoid: OrganoidBootstrapResult;
  glyph: ReturnType<typeof digestPulseHeart>;
  glyphStatus: GlyphStatusPayload;
}

async function buildGlyphStatusPayload(context: ServerRuntimeContext): Promise<GlyphStatusPayload> {
  const pulse = digestPulseHeart(await loadPulseHeartSnapshot());
  getStateStore();
  return buildGlyphStatus({
    service: SERVICE_NAME,
    store: getStoreType(),
    organoid: context.organoid,
    pulse,
  });
}

async function buildHealthBody(context: ServerRuntimeContext): Promise<HealthBody> {
  const report = await runHealthChecks({ includeRecentPoll: false });
  const pulse = digestPulseHeart(await loadPulseHeartSnapshot());
  const glyphStatus = await buildGlyphStatusPayload(context);

  return {
    ok: report.status === "healthy",
    status: report.status,
    version: process.env.npm_package_version ?? "1.0.0",
    uptime: Math.floor((Date.now() - context.startedAt) / 1000),
    service: SERVICE_NAME,
    store: getStoreType(),
    checks: report.checks,
    organoid: context.organoid,
    glyph: pulse,
    glyphStatus,
  };
}

async function buildMetricsBody(context: ServerRuntimeContext): Promise<string> {
  const uptime = Math.floor((Date.now() - context.startedAt) / 1000);
  const pulse = await loadPulseHeartSnapshot();
  const matrixLines =
    context.organoid.matrix
      .map((node, index) => `bot_organoid_matrix_node{slot="${index + 1}",id="${node.id}",glyph="${node.glyph}"} 1`)
      .join("\n") ?? "";
  const phaseLines =
    context.organoid.phases
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

  return `# HELP bot_uptime_seconds Process uptime in seconds
# TYPE bot_uptime_seconds gauge
bot_uptime_seconds ${uptime}
${matrixLines ? `${matrixLines}\n` : ""}${phaseLines ? `${phaseLines}\n` : ""}${pulseLines}
`;
}

async function sendJson(res: ServerResponse, statusCode: number, body: unknown): Promise<void> {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body, null, 2));
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, context: ServerRuntimeContext): Promise<void> {
  const url = req.url ?? "/";
  const requestPath = url.split("?")[0];

  if (requestPath === "/health" || requestPath === "/") {
    const body = await buildHealthBody(context);
    await sendJson(res, body.status === "healthy" ? 200 : 503, body);
    return;
  }

  if (requestPath === "/glyph-status") {
    const body = await buildGlyphStatusPayload(context);
    await sendJson(res, 200, body);
    return;
  }

  if (requestPath === "/glyph" || requestPath === "/overlay") {
    const pulse = await loadPulseHeartSnapshot();
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(renderPulseHeartOverlayHtml(pulse));
    return;
  }

  if (requestPath === "/glyph.svg") {
    const pulse = await loadPulseHeartSnapshot();
    res.writeHead(200, {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(pulse.svg);
    return;
  }

  if (requestPath === "/glyph.json") {
    const pulse = await loadPulseHeartSnapshot();
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(pulse, null, 2));
    return;
  }

  if (requestPath === "/ready") {
    try {
      const store = getStateStore();
      const ready = await store.ping();
      res.writeHead(ready ? 200 : 503, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(ready ? "ready" : "not ready");
    } catch {
      res.writeHead(503, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end("not ready");
    }
    return;
  }

  if (requestPath === "/metrics") {
    const metrics = await buildMetricsBody(context);
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(metrics);
    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end("Not Found");
}

export function createServer(context: ServerRuntimeContext): http.Server {
  return http.createServer((req, res) => {
    void handleRequest(req, res, context).catch((error) => {
      console.error("[server] request handler failed:", error);
      if (!res.headersSent) {
        res.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        });
      }
      res.end("internal server error");
    });
  });
}

export async function createServerContext(
  scope: "server" = "server",
  options?: { emitTerminal?: boolean },
): Promise<ServerRuntimeContext> {
  installPulseHeartConsoleTap();
  const startedAt = Date.now();
  const organoid = await bootstrapOrganoidRuntime(scope);
  await bootstrapPulseHeart({
    scope,
    matrix: organoid.matrix,
    phases: organoid.phases,
    emitTerminal: options?.emitTerminal ?? true,
  });
  const store = getStateStore();
  setHealthDeps({
    getAuditBufferSize: () => 0,
    loadCursor: () => store.getCursor(),
  });
  console.log(`[ORGANOID] LEGACY_COMPAT=${organoid.legacyCompat ? "true" : "false"}`);
  console.log(`[ORGANOID] 7-organoid matrix: ${formatOrganoidMatrixSummary(organoid.matrix)}`);
  console.log(`[ORGANOID] 5-phase model: ${organoid.phases.join(" -> ")}`);
  if (organoid.warnings.length > 0) {
    console.warn("[ORGANOID] Bootstrap warnings:", organoid.warnings.join(" | "));
  }
  return { startedAt, organoid };
}

export async function main(): Promise<http.Server> {
  const context = await createServerContext("server");
  const server = createServer(context);
  server.listen(PORT, () => {
    console.log(`[server] Health server listening on port ${PORT}`);
  });
  return server;
}

function isEntrypoint(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(path.resolve(entry)).href === import.meta.url;
}

if (isEntrypoint()) {
  void main().catch((error) => {
    console.error("[FATAL] Health server crashed:", error);
    process.exit(1);
  });
}

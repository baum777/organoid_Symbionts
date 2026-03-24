/**
 * Organoid Bot — Canonical Entrypoint
 *
 * Production entrypoint for the mention poller worker.
 * Loads env, validates config, and runs the worker loop.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });
import { validateEnv } from "./config/envSchema.js";
import { validateLaunchEnvOrExit } from "./config/env.js";
import { bootstrapOrganoidRuntime, formatOrganoidMatrixSummary } from "./organoid/bootstrap.js";
import { runWorkerLoop } from "./worker/pollMentions.js";
import { runTimelineEngagementLoop } from "./worker/pollTimelineEngagement.js";

async function main(): Promise<void> {
  if (process.env.SKIP_ENV_VALIDATION !== "true") {
    validateEnv();
    validateLaunchEnvOrExit();
  }

  const organoid = await bootstrapOrganoidRuntime("worker");
  console.log(`[ORGANOID] LEGACY_COMPAT=${organoid.legacyCompat ? "true" : "false"}`);
  console.log(`[ORGANOID] 7-organoid matrix: ${formatOrganoidMatrixSummary(organoid.matrix)}`);
  console.log(`[ORGANOID] 5-phase model: ${organoid.phases.join(" -> ")}`);
  if (organoid.warnings.length > 0) {
    console.warn("[ORGANOID] Bootstrap warnings:", organoid.warnings.join(" | "));
  }

  await Promise.all([runWorkerLoop(), runTimelineEngagementLoop()]);
}

main().catch((e) => {
  console.error("[FATAL] Worker crashed:", e);
  process.exit(1);
});

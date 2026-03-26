import { existsSync } from "node:fs";
import { validateEnv } from "../src/config/envSchema.js";
import { validateLaunchEnvOrExit } from "../src/config/env.js";
import { createServerContext } from "../src/server.js";
import { runHealthChecks, type HealthReport } from "../src/observability/health.js";
import { digestPulseHeart, loadPulseHeartSnapshot } from "../src/observability/pulseHeart.js";
import { buildGlyphStatus, type GlyphStatusPayload } from "../src/observability/glyphStatus.js";
import { getStoreType } from "../src/state/storeFactory.js";
import { loadEmbodimentFragment, loadPresetFragment, loadSharedOrganoidCanon } from "../src/prompts/promptFragments.js";

export type PreflightMode = "health" | "deploy";

export interface PreflightSummary {
  mode: PreflightMode;
  ok: boolean;
  health: HealthReport;
  glyphStatus: GlyphStatusPayload;
  promptAssets: {
    sharedOrganoidCanon: boolean;
    initiateSymbiosis: boolean;
    stillhalterEmbodiment: boolean;
  };
  deployArtifacts: {
    renderYaml: boolean;
    dockerfileNode: boolean;
    packageJson: boolean;
    readmeSymbionts: boolean;
  };
  warnings: string[];
  errors: string[];
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function missingArtifacts(summary: PreflightSummary): string[] {
  const missing: string[] = [];
  if (!summary.promptAssets.sharedOrganoidCanon) missing.push("prompts/fragments/sharedOrganoidCanon.md");
  if (!summary.promptAssets.initiateSymbiosis) missing.push("prompts/presets/initiate-symbiosis.md");
  if (!summary.promptAssets.stillhalterEmbodiment) missing.push("prompts/fragments/embodiments/stillhalter.md");
  if (summary.mode === "deploy") {
    if (!summary.deployArtifacts.renderYaml) missing.push("render.yaml");
    if (!summary.deployArtifacts.dockerfileNode) missing.push("Dockerfile.node");
    if (!summary.deployArtifacts.packageJson) missing.push("package.json");
    if (!summary.deployArtifacts.readmeSymbionts) missing.push("README_SYMBIONTS.md");
  }
  return missing;
}

async function buildSummary(mode: PreflightMode, validateEnvironment: boolean, scope: "server" | "worker"): Promise<PreflightSummary> {
  if (validateEnvironment) {
    validateEnv();
    validateLaunchEnvOrExit();
  }

  const context = await createServerContext(scope, { emitTerminal: false });
  const health = await runHealthChecks({ includeRecentPoll: false });
  const pulse = digestPulseHeart(await loadPulseHeartSnapshot());
  const glyphStatus = buildGlyphStatus({
    service: "organoid-symbiont",
    store: getStoreType(),
    organoid: context.organoid,
    pulse,
  });

  const summary: PreflightSummary = {
    mode,
    ok: true,
    health,
    glyphStatus,
    promptAssets: {
      sharedOrganoidCanon: existsSync("prompts/fragments/sharedOrganoidCanon.md") && loadSharedOrganoidCanon().trim().length > 0,
      initiateSymbiosis: existsSync("prompts/presets/initiate-symbiosis.md") && loadPresetFragment("initiate-symbiosis.md").trim().length > 0,
      stillhalterEmbodiment: existsSync("prompts/fragments/embodiments/stillhalter.md") && loadEmbodimentFragment("stillhalter").trim().length > 0,
    },
    deployArtifacts: {
      renderYaml: existsSync("render.yaml"),
      dockerfileNode: existsSync("Dockerfile.node"),
      packageJson: existsSync("package.json"),
      readmeSymbionts: existsSync("README_SYMBIONTS.md"),
    },
    warnings: uniq([
      ...context.organoid.warnings,
      ...health.checks
        .filter((check) => check.status === "degraded")
        .map((check) => `${check.name}: ${check.message ?? "degraded"}`),
    ]),
    errors: [],
  };

  const unhealthyChecks = health.checks
    .filter((check) => check.status === "unhealthy")
    .map((check) => `health:${check.name}${check.message ? `:${check.message}` : ""}`);
  const missing = missingArtifacts(summary);

  summary.errors = uniq([...unhealthyChecks, ...missing.map((item) => `missing:${item}`)]);
  summary.ok = summary.errors.length === 0;
  return summary;
}

export async function runSymbiontHealthCheck(options?: {
  validateEnvironment?: boolean;
  scope?: "server" | "worker";
}): Promise<PreflightSummary> {
  const validateEnvironment = options?.validateEnvironment ?? process.env.SKIP_ENV_VALIDATION !== "true";
  const scope = options?.scope ?? "server";
  return buildSummary("health", validateEnvironment, scope);
}

export async function runDeployCheck(options?: {
  validateEnvironment?: boolean;
  scope?: "server" | "worker";
}): Promise<PreflightSummary> {
  const validateEnvironment = options?.validateEnvironment ?? process.env.SKIP_ENV_VALIDATION !== "true";
  const scope = options?.scope ?? "server";
  return buildSummary("deploy", validateEnvironment, scope);
}

export function printPreflightSummary(summary: PreflightSummary): void {
  console.log(JSON.stringify(summary, null, 2));
}

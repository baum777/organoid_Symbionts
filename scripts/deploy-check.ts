import path from "node:path";
import { pathToFileURL } from "node:url";
import { runDeployCheck, printPreflightSummary } from "./preflight.js";

async function main(): Promise<void> {
  const summary = await runDeployCheck();
  printPreflightSummary(summary);

  if (summary.warnings.length > 0) {
    console.warn(`[deploy-check] warnings: ${summary.warnings.join(" | ")}`);
  }

  if (!summary.ok) {
    console.error(`[deploy-check] errors: ${summary.errors.join(" | ")}`);
    process.exit(1);
  }
}

function isEntrypoint(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(path.resolve(entry)).href === import.meta.url;
}

if (isEntrypoint()) {
  void main().catch((error) => {
    console.error("[FATAL] deploy-check crashed:", error);
    process.exit(1);
  });
}

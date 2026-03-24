/**
 * Prompt Loader — Load and render embodiment prompt templates
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORGANOID_PROMPTS_DIR = join(__dirname, "organoid");

export interface PromptVariables {
  mention_text: string;
  thread_summary: string;
  entities: string;
  claims: string;
  timeline: string;
  constraints: string;
}

export function loadOrganoidSystemPrompt(): string {
  return readFileSync(join(ORGANOID_PROMPTS_DIR, "organoid_system.md"), "utf-8").trim();
}

export function loadOrganoidDeveloperPrompt(): string {
  return readFileSync(join(ORGANOID_PROMPTS_DIR, "organoid_developer.md"), "utf-8").trim();
}

export function loadOrganoidUserTemplate(): string {
  return readFileSync(join(ORGANOID_PROMPTS_DIR, "organoid_user_template.md"), "utf-8").trim();
}

export function renderUserPrompt(vars: PromptVariables): string {
  const template = loadOrganoidUserTemplate();
  return template
    .replace(/\{\{mention_text\}\}/g, vars.mention_text)
    .replace(/\{\{thread_summary\}\}/g, vars.thread_summary)
    .replace(/\{\{entities\}\}/g, vars.entities)
    .replace(/\{\{claims\}\}/g, vars.claims)
    .replace(/\{\{timeline\}\}/g, vars.timeline)
    .replace(/\{\{constraints\}\}/g, vars.constraints);
}

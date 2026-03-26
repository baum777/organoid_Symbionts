import { loadEmbodiments } from "../embodiments/loadEmbodiments.js";
import { getAllEmbodiments, getEmbodiment } from "../embodiments/registry.js";
import { getProfileEmbodiment, getProfileGlyph, type EmbodimentProfile, type OrganoidPhase } from "../embodiments/types.js";
import { ORGANOID_PHASES } from "./orchestration.js";

export { ORGANOID_PHASES };

export const ORGANOID_MATRIX_ORDER = [
  "stillhalter",
  "wurzelwaechter",
  "pilzarchitekt",
  "muenzhueter",
  "erzlauscher",
  "glutkern",
  "nebelspieler",
] as const;

export interface OrganoidMatrixNode {
  id: string;
  embodiment: string;
  glyph: string;
  role: string;
  archetype: string;
  phaseAffinities: OrganoidPhase[];
}

export interface OrganoidBootstrapResult {
  loadedCount: number;
  matrix: OrganoidMatrixNode[];
  phases: readonly OrganoidPhase[];
  warnings: string[];
  legacyCompat: boolean;
}

function toMatrixNode(profile: EmbodimentProfile): OrganoidMatrixNode {
  return {
    id: profile.id,
    embodiment: getProfileEmbodiment(profile),
    glyph: getProfileGlyph(profile).char,
    role: profile.role,
    archetype: profile.archetype,
    phaseAffinities: profile.phase_affinities ?? [],
  };
}

function sortByCanonicalOrder(a: OrganoidMatrixNode, b: OrganoidMatrixNode): number {
  const ai = ORGANOID_MATRIX_ORDER.indexOf(a.id as (typeof ORGANOID_MATRIX_ORDER)[number]);
  const bi = ORGANOID_MATRIX_ORDER.indexOf(b.id as (typeof ORGANOID_MATRIX_ORDER)[number]);
  if (ai === bi) return a.id.localeCompare(b.id);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export function formatOrganoidMatrixSummary(matrix: OrganoidMatrixNode[]): string {
  return matrix.map((node) => `${node.glyph} ${node.embodiment}`).join(" | ");
}

export async function bootstrapOrganoidRuntime(scope: "worker" | "server"): Promise<OrganoidBootstrapResult> {
  const warnings: string[] = [];
  const legacyCompat = process.env.LEGACY_COMPAT === "true" || process.env.LEGACY_COMPAT === "1";

  try {
    await loadEmbodiments();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const warning = `[ORGANOID] Failed to load matrix profiles during ${scope} bootstrap: ${message}`;
    warnings.push(warning);
    console.warn(warning);
  }

  const loadedProfiles = getAllEmbodiments();
  const matrix = loadedProfiles.map(toMatrixNode).sort(sortByCanonicalOrder);

  const missingIds = ORGANOID_MATRIX_ORDER.filter((id) => !matrix.some((node) => node.id === id));
  if (missingIds.length > 0) {
    const warning = `[ORGANOID] Incomplete ${scope} matrix. Missing: ${missingIds.join(", ")}`;
    warnings.push(warning);
    console.warn(warning);
  }

  if (matrix.length === 0) {
    const warning = "[ORGANOID] No organoid profiles were loaded; runtime will proceed in degraded mode.";
    warnings.push(warning);
    console.warn(warning);
  }

  for (const id of ORGANOID_MATRIX_ORDER) {
    if (!getEmbodiment(id)) {
      const warning = `[ORGANOID] Missing registry entry for ${id}`;
      warnings.push(warning);
      console.warn(warning);
    }
  }

  return {
    loadedCount: loadedProfiles.length,
    matrix,
    phases: ORGANOID_PHASES,
    warnings,
    legacyCompat,
  };
}

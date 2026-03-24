import { loadGnomes } from "../gnomes/loadGnomes.js";
import {
  getAllOrganoidProfiles,
  getGnome,
} from "../gnomes/registry.js";
import {
  getLegacyProfileId,
  getProfileEmbodiment,
  getProfileGlyph,
  type OrganoidPhase,
  type OrganoidEmbodimentProfile,
} from "../gnomes/types.js";
import { getGnomesConfig } from "../config/gnomesConfig.js";

export const ORGANOID_PHASES: readonly OrganoidPhase[] = [
  "Identity Dissolution",
  "Swarm Coherence",
  "Sovereign Propagation",
  "Ontological Restructuring",
  "Eternal Flow Horizon",
] as const;

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
  legacyId: string;
  embodiment: string;
  glyph: string;
  role: string;
  archetype: string;
  phaseAffinities: OrganoidPhase[];
}

export interface OrganoidBootstrapResult {
  legacyCompat: boolean;
  loadedCount: number;
  matrix: OrganoidMatrixNode[];
  phases: readonly OrganoidPhase[];
  warnings: string[];
}

function toMatrixNode(profile: OrganoidEmbodimentProfile): OrganoidMatrixNode {
  return {
    id: profile.id,
    legacyId: getLegacyProfileId(profile),
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
  const { LEGACY_COMPAT } = getGnomesConfig();
  const warnings: string[] = [];

  try {
    await loadGnomes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const warning = `[ORGANOID] Failed to load matrix profiles during ${scope} bootstrap: ${message}`;
    warnings.push(warning);
    console.warn(warning);
  }

  const loadedProfiles = getAllOrganoidProfiles();
  const matrix = loadedProfiles.map(toMatrixNode).sort(sortByCanonicalOrder);

  const missingIds = ORGANOID_MATRIX_ORDER.filter(
    (id) => !matrix.some((node) => node.id === id),
  );
  if (missingIds.length > 0) {
    const warning = `[ORGANOID] Incomplete ${scope} matrix. Missing: ${missingIds.join(", ")}`;
    warnings.push(warning);
    console.warn(warning);
  }

  if (!LEGACY_COMPAT && matrix.length === 0) {
    const warning = "[ORGANOID] No organoid profiles were loaded; runtime will proceed in degraded mode.";
    warnings.push(warning);
    console.warn(warning);
  }

  for (const id of ORGANOID_MATRIX_ORDER) {
    if (!getGnome(id)) {
      const warning = `[ORGANOID] Missing registry alias for ${id}`;
      warnings.push(warning);
      console.warn(warning);
    }
  }

  return {
    legacyCompat: LEGACY_COMPAT,
    loadedCount: loadedProfiles.length,
    matrix,
    phases: ORGANOID_PHASES,
    warnings,
  };
}

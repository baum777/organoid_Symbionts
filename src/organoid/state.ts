import type { StateStore } from "../state/stateStore.js";
import { getStateStore } from "../state/storeFactory.js";
import type { OrganoidPhase } from "../embodiments/types.js";
import type {
  OrganoidIntervention,
  OrganoidOrchestrationContract,
  OrganoidRenderPolicy,
  OrganoidRuntimeState,
} from "./orchestration.js";

export interface OrganoidShortTermMatrix {
  version: 1;
  lastPhase: OrganoidPhase | null;
  phaseTransitionPressure: number;
  lastLeadEmbodimentId: string | null;
  lastInterventionType: OrganoidIntervention | null;
  driftSignal: number;
  lastRenderPolicy?: OrganoidRenderPolicy | null;
  updatedAt: string;
}

export const ORGANOID_SHORT_TERM_MATRIX_KEY = "organoid:short_term_matrix:v1";
export const ORGANOID_SHORT_TERM_MATRIX_TTL_SECONDS = 12 * 60 * 60;

const PHASE_VALUES = new Set<OrganoidPhase>([
  "Identity Dissolution",
  "Swarm Coherence",
  "Sovereign Propagation",
  "Ontological Restructuring",
  "Eternal Flow Horizon",
]);

const INTERVENTION_VALUES = new Set<OrganoidIntervention>([
  "entangle",
  "bundle",
  "propagate",
  "reframe",
  "stabilize",
  "silence",
]);

const RENDER_VALUES = new Set<OrganoidRenderPolicy>([
  "lead_only",
  "lead_plus_anchor",
  "lead_plus_counterweight",
  "multi_internal_single_external",
  "suppress_external_multi",
]);

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizePhase(value: unknown): OrganoidPhase | null {
  const phase = normalizeString(value);
  return phase && PHASE_VALUES.has(phase as OrganoidPhase) ? (phase as OrganoidPhase) : null;
}

function normalizeIntervention(value: unknown): OrganoidIntervention | null {
  const intervention = normalizeString(value);
  return intervention && INTERVENTION_VALUES.has(intervention as OrganoidIntervention)
    ? (intervention as OrganoidIntervention)
    : null;
}

function normalizeRenderPolicy(value: unknown): OrganoidRenderPolicy | null {
  const renderPolicy = normalizeString(value);
  return renderPolicy && RENDER_VALUES.has(renderPolicy as OrganoidRenderPolicy)
    ? (renderPolicy as OrganoidRenderPolicy)
    : null;
}

function normalizeMatrix(raw: Partial<OrganoidShortTermMatrix> | null | undefined): OrganoidShortTermMatrix {
  return {
    version: 1,
    lastPhase: normalizePhase(raw?.lastPhase),
    phaseTransitionPressure: clamp(typeof raw?.phaseTransitionPressure === "number" ? raw.phaseTransitionPressure : 0),
    lastLeadEmbodimentId: normalizeString(raw?.lastLeadEmbodimentId),
    lastInterventionType: normalizeIntervention(raw?.lastInterventionType),
    driftSignal: clamp(typeof raw?.driftSignal === "number" ? raw.driftSignal : 0),
    lastRenderPolicy: normalizeRenderPolicy(raw?.lastRenderPolicy),
    updatedAt: typeof raw?.updatedAt === "string" && raw.updatedAt.trim().length > 0 ? raw.updatedAt : new Date().toISOString(),
  };
}

export function createDefaultOrganoidShortTermMatrix(): OrganoidShortTermMatrix {
  return normalizeMatrix(null);
}

export async function loadOrganoidShortTermMatrix(store?: StateStore): Promise<OrganoidShortTermMatrix> {
  const kv = store ?? getStateStore();
  try {
    const raw = await kv.get(ORGANOID_SHORT_TERM_MATRIX_KEY);
    if (!raw) return createDefaultOrganoidShortTermMatrix();
    return normalizeMatrix(JSON.parse(raw) as Partial<OrganoidShortTermMatrix>);
  } catch {
    return createDefaultOrganoidShortTermMatrix();
  }
}

export async function saveOrganoidShortTermMatrix(
  matrix: OrganoidShortTermMatrix,
  store?: StateStore,
): Promise<OrganoidShortTermMatrix> {
  const kv = store ?? getStateStore();
  const normalized = normalizeMatrix(matrix);
  await kv.set(ORGANOID_SHORT_TERM_MATRIX_KEY, JSON.stringify(normalized), ORGANOID_SHORT_TERM_MATRIX_TTL_SECONDS);
  return normalized;
}

export function buildOrganoidRuntimeState(
  matrix: OrganoidShortTermMatrix | null | undefined,
  overrides?: {
    recentPhases?: OrganoidPhase[];
    recentEmbodimentIds?: string[];
    matrixBias?: Partial<Record<OrganoidPhase, number>>;
    driftPressure?: number;
    coherence?: number;
  },
): OrganoidRuntimeState {
  const normalizedMatrix = matrix ? normalizeMatrix(matrix) : null;
  const recentPhases = [...(overrides?.recentPhases ?? [])];
  if (normalizedMatrix?.lastPhase) recentPhases.push(normalizedMatrix.lastPhase);

  const recentEmbodimentIds = [...(overrides?.recentEmbodimentIds ?? [])];
  if (normalizedMatrix?.lastLeadEmbodimentId) recentEmbodimentIds.push(normalizedMatrix.lastLeadEmbodimentId);

  const matrixBias = { ...(overrides?.matrixBias ?? {}) };
  if (normalizedMatrix?.lastPhase) {
    const bonus = clamp(
      (1 - normalizedMatrix.phaseTransitionPressure) * 0.18 - normalizedMatrix.driftSignal * 0.08,
      -0.25,
      0.25,
    );
    matrixBias[normalizedMatrix.lastPhase] = clamp((matrixBias[normalizedMatrix.lastPhase] ?? 0) + bonus, -0.25, 0.25);
  }

  return {
    recentPhases: Array.from(new Set(recentPhases)).slice(-3),
    recentEmbodimentIds: Array.from(new Set(recentEmbodimentIds)).slice(-3),
    matrixBias,
    driftPressure: clamp(Math.max(overrides?.driftPressure ?? 0, normalizedMatrix?.phaseTransitionPressure ?? 0, normalizedMatrix?.driftSignal ?? 0)),
    coherence: clamp(overrides?.coherence ?? Math.max(0, 1 - (normalizedMatrix?.driftSignal ?? 0))),
    shortTermMatrix: normalizedMatrix ?? undefined,
  };
}

export function captureOrganoidShortTermMatrix(
  contract: OrganoidOrchestrationContract,
  previous?: OrganoidShortTermMatrix | null,
): OrganoidShortTermMatrix {
  const baseline = previous ? normalizeMatrix(previous) : createDefaultOrganoidShortTermMatrix();
  const freshDrift = clamp(
    Math.max(
      contract.phase.transitionPressure,
      contract.validation.ok ? 0 : 0.2,
      contract.validation.reasons.length > 0 ? 0.08 : 0,
      contract.validation.warnings.length > 0 ? 0.05 : 0,
      contract.silencePolicy === "silence" ? 0.3 : 0,
    ),
  );

  return normalizeMatrix({
    version: 1,
    lastPhase: contract.phase.activePhase,
    phaseTransitionPressure: clamp(baseline.phaseTransitionPressure * 0.35 + contract.phase.transitionPressure * 0.65),
    lastLeadEmbodimentId: contract.leadEmbodimentId,
    lastInterventionType: contract.interventionType,
    driftSignal: clamp(baseline.driftSignal * 0.4 + freshDrift * 0.6),
    lastRenderPolicy: contract.renderPolicy,
    updatedAt: new Date().toISOString(),
  });
}

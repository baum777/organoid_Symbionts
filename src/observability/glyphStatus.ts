import { formatOrganoidMatrixSummary, type OrganoidBootstrapResult } from "../organoid/bootstrap.js";

export interface GlyphStatusPulseDigest {
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
}

export interface GlyphStatusPayload extends GlyphStatusPulseDigest {
  service: string;
  store: "redis" | "filesystem" | "unknown";
  legacyCompat: boolean;
  loadedCount: number;
  phaseCount: number;
  warnings: string[];
  matrixSummary: string;
}

export function buildGlyphStatus(params: {
  service: string;
  store: "redis" | "filesystem" | "unknown";
  organoid: OrganoidBootstrapResult | null;
  pulse: GlyphStatusPulseDigest;
}): GlyphStatusPayload {
  const organoid = params.organoid;
  return {
    service: params.service,
    store: params.store,
    legacyCompat: organoid?.legacyCompat ?? false,
    loadedCount: organoid?.loadedCount ?? 0,
    phaseCount: organoid?.phases.length ?? 0,
    warnings: organoid?.warnings ?? [],
    matrixSummary: organoid?.matrix?.length ? formatOrganoidMatrixSummary(organoid.matrix) : "∅",
    ...params.pulse,
  };
}

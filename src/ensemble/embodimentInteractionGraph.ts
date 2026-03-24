/**
 * TODO(ORGANOID-MIGRATION): Wave 2 replaces hidden `spark`/`organoid`/`moss` remnants with registry-aligned runtime relations.
 * LEGACY-EMBODIMENT: keep the file path for compatibility until ensemble orchestration is fully embodiment-first.
 */

/**
 * Embodiment Interaction Graph — Embodiment-to-embodiment relationships
 *
 * Phase-4: Influences cameo likelihood (rivalry, mentor, alliance, etc.).
 */

export type RelationshipType =
  | "rivalry"
  | "mentor"
  | "teasing"
  | "alliance"
  | "mockery"
  | "respect"
  | "stabilizes"
  | "suppresses"
  | "complements";

export interface EmbodimentRelationship {
  embodimentA: string;
  embodimentB: string;
  type: RelationshipType;
  strength: number; // 0..1
}

const DEFAULT_RELATIONSHIPS: EmbodimentRelationship[] = [
  { embodimentA: "stillhalter", embodimentB: "nebelspieler", type: "suppresses", strength: 0.82 },
  { embodimentA: "stillhalter", embodimentB: "pilzarchitekt", type: "stabilizes", strength: 0.74 },
  { embodimentA: "stillhalter", embodimentB: "muenzhueter", type: "complements", strength: 0.71 },
  { embodimentA: "glutkern", embodimentB: "nebelspieler", type: "teasing", strength: 0.77 },
  { embodimentA: "glutkern", embodimentB: "wurzelwaechter", type: "stabilizes", strength: 0.68 },
  { embodimentA: "pilzarchitekt", embodimentB: "erzlauscher", type: "alliance", strength: 0.72 },
];

const graph = new Map<string, Map<string, EmbodimentRelationship>>();

function key(a: string, b: string): string {
  return [a, b].sort().join(":");
}

function init(): void {
  if (graph.size > 0) return;
  for (const r of DEFAULT_RELATIONSHIPS) {
    const k = key(r.embodimentA, r.embodimentB);
    graph.set(k, new Map());
    graph.get(k)!.set("rel", r);
  }
}

/** Get relationship between two embodiments. */
export function getRelationship(embodimentA: string, embodimentB: string): EmbodimentRelationship | null {
  init();
  const k = key(embodimentA, embodimentB);
  return (graph.get(k)?.get("rel") as EmbodimentRelationship) ?? null;
}

/** Check if embodimentB is likely to cameo after embodimentA. */
export function getCameoLikelihood(primary: string, candidate: string): number {
  const rel = getRelationship(primary, candidate);
  if (!rel) return 0.3;
  if (["teasing", "mockery", "alliance", "complements"].includes(rel.type)) return 0.4 + rel.strength * 0.3;
  if (["stabilizes", "respect"].includes(rel.type)) return 0.35 + rel.strength * 0.25;
  if (rel.type === "suppresses") return 0.2 + rel.strength * 0.15;
  return 0.3;
}

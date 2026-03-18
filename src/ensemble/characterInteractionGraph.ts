/**
 * TODO(ORGANOID-MIGRATION): Wave 2 replaces hidden `spark`/`gorky`/`moss` remnants with registry-aligned runtime relations.
 * LEGACY-PERSONA: keep the file path for compatibility until ensemble orchestration is fully embodiment-first.
 */

/**
 * Character Interaction Graph — Gnome-to-gnome relationships
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

export interface CharacterRelationship {
  gnomeA: string;
  gnomeB: string;
  type: RelationshipType;
  strength: number; // 0..1
}

const DEFAULT_RELATIONSHIPS: CharacterRelationship[] = [
  { gnomeA: "stillhalter", gnomeB: "nebelspieler", type: "suppresses", strength: 0.82 },
  { gnomeA: "stillhalter", gnomeB: "pilzarchitekt", type: "stabilizes", strength: 0.74 },
  { gnomeA: "stillhalter", gnomeB: "muenzhueter", type: "complements", strength: 0.71 },
  { gnomeA: "glutkern", gnomeB: "nebelspieler", type: "teasing", strength: 0.77 },
  { gnomeA: "glutkern", gnomeB: "wurzelwaechter", type: "stabilizes", strength: 0.68 },
  { gnomeA: "pilzarchitekt", gnomeB: "erzlauscher", type: "alliance", strength: 0.72 },
];

const graph = new Map<string, Map<string, CharacterRelationship>>();

function key(a: string, b: string): string {
  return [a, b].sort().join(":");
}

function init(): void {
  if (graph.size > 0) return;
  for (const r of DEFAULT_RELATIONSHIPS) {
    const k = key(r.gnomeA, r.gnomeB);
    graph.set(k, new Map());
    graph.get(k)!.set("rel", r);
  }
}

/** Get relationship between two gnomes. */
export function getRelationship(gnomeA: string, gnomeB: string): CharacterRelationship | null {
  init();
  const k = key(gnomeA, gnomeB);
  return (graph.get(k)?.get("rel") as CharacterRelationship) ?? null;
}

/** Check if gnomeB is likely to cameo after gnomeA. */
export function getCameoLikelihood(primary: string, candidate: string): number {
  const rel = getRelationship(primary, candidate);
  if (!rel) return 0.3;
  if (["teasing", "mockery", "alliance", "complements"].includes(rel.type)) return 0.4 + rel.strength * 0.3;
  if (["stabilizes", "respect"].includes(rel.type)) return 0.35 + rel.strength * 0.25;
  if (rel.type === "suppresses") return 0.2 + rel.strength * 0.15;
  return 0.3;
}

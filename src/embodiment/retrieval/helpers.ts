import type { EmbodimentProfile } from "../../embodiments/types.js";
import type { EmbodimentSemanticStore } from "../memoryTypes.js";
import type { EmbodimentSemanticRecord } from "../types.js";

export interface EmbodimentSemanticScore {
  embodimentId: string;
  ruleBasedScore: number;
  semanticFitScore: number;
  continuityScore: number;
  finalSelectionScore: number;
  anchors: string[];
  boundaries: string[];
  explain: string[];
}

function lexicalMatchScore(text: string, query: string): number {
  const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const low = text.toLowerCase();
  return tokens.filter((t) => low.includes(t)).length / tokens.length;
}

export async function scoreSemanticEmbodimentFit(args: {
  store: EmbodimentSemanticStore;
  embodiments: EmbodimentProfile[];
  queryText: string;
  ruleBasedScores?: Record<string, number>;
  continuityEmbodimentId?: string;
}): Promise<EmbodimentSemanticScore[]> {
  const all = await args.store.query({ queryText: args.queryText, limit: 200, includeInactive: false });

  return args.embodiments
    .map((embodiment) => {
      const embodimentRecords = all.filter((r) => r.embodimentId === embodiment.id);
      const semanticFit = embodimentRecords.length === 0
        ? 0
        : Math.min(
            1,
            embodimentRecords.reduce((acc, r) => acc + lexicalMatchScore(r.text, args.queryText), 0) / embodimentRecords.length,
          );
      const ruleBasedScore = args.ruleBasedScores?.[embodiment.id] ?? 0;
      const continuityScore = args.continuityEmbodimentId === embodiment.id ? 0.15 : 0;
      const finalSelectionScore = ruleBasedScore * 0.65 + semanticFit * 0.3 + continuityScore;
      const anchors = embodimentRecords.filter((r) => r.docType === "embodiment_style_anchor").slice(0, 3).map((r) => r.text);
      const boundaries = embodimentRecords.filter((r) => r.docType === "embodiment_negative_boundary").slice(0, 3).map((r) => r.text);

      return {
        embodimentId: embodiment.id,
        ruleBasedScore,
        semanticFitScore: semanticFit,
        continuityScore,
        finalSelectionScore,
        anchors,
        boundaries,
        explain: [
          `rule=${ruleBasedScore.toFixed(2)}`,
          `semantic=${semanticFit.toFixed(2)}`,
          `continuity=${continuityScore.toFixed(2)}`,
        ],
      };
    })
    .sort((a, b) => b.finalSelectionScore - a.finalSelectionScore || a.embodimentId.localeCompare(b.embodimentId));
}

export async function retrieveEmbodimentContext(store: EmbodimentSemanticStore, embodimentId: string, queryText: string): Promise<EmbodimentSemanticRecord[]> {
  return store.query({
    queryText,
    embodimentId,
    namespaces: ["embodiments-core", "embodiments-style"],
    docTypes: ["embodiment_core", "embodiment_style_anchor", "embodiment_negative_boundary", "embodiment_activation_rule"],
    limit: 8,
  });
}

export async function retrieveEmbodimentExemplars(store: EmbodimentSemanticStore, embodimentId: string, queryText: string): Promise<EmbodimentSemanticRecord[]> {
  return store.query({ queryText, embodimentId, namespaces: ["embodiments-examples"], docTypes: ["embodiment_example"], limit: 4 });
}

export async function retrieveEmbodimentRelations(store: EmbodimentSemanticStore, embodimentId: string, queryText: string): Promise<EmbodimentSemanticRecord[]> {
  return store.query({ queryText, embodimentId, namespaces: ["embodiments-relations"], docTypes: ["embodiment_relation"], limit: 6 });
}

export async function retrieveLoreSupport(store: EmbodimentSemanticStore, embodimentId: string, queryText: string): Promise<EmbodimentSemanticRecord[]> {
  return store.query({ queryText, embodimentId, namespaces: ["lore-active"], docTypes: ["lore_chunk"], limit: 4 });
}

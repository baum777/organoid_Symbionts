import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmbodimentProfile } from "../../embodiments/types.js";
import type { SelectorFeatures } from "../../routing/selectorFeatures.js";
import type { EmbodimentSemanticRecord } from "../types.js";
import { InMemoryEmbodimentSemanticStore } from "../stores/inMemoryEmbodimentSemanticStore.js";
import { scoreSemanticEmbodimentFit } from "./helpers.js";

let cachedStore: InMemoryEmbodimentSemanticStore | null = null;
let loaded = false;

async function getStore(): Promise<InMemoryEmbodimentSemanticStore> {
  if (cachedStore && loaded) return cachedStore;
  const store = new InMemoryEmbodimentSemanticStore();
  const file = join(process.cwd(), "artifacts", "embodiment-semantic-records.json");

  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as EmbodimentSemanticRecord[];
    if (Array.isArray(parsed)) await store.upsert(parsed);
  } catch {
    // optional artifact
  }

  cachedStore = store;
  loaded = true;
  return store;
}

export async function buildSemanticSelectionInputs(args: {
  embodiments: EmbodimentProfile[];
  features: SelectorFeatures;
  ruleBasedScores: Record<string, number>;
  continuityEmbodimentId?: string;
}): Promise<{
  semanticFitByEmbodiment: Record<string, number>;
  continuityBonusByEmbodiment: Record<string, number>;
  semanticExplainByEmbodiment: Record<string, { anchors: string[]; boundaries: string[]; reasons: string[] }>;
}> {
  const store = await getStore();
  const scored = await scoreSemanticEmbodimentFit({
    store,
    embodiments: args.embodiments,
    queryText: `${args.features.intent} ${args.features.topicTags.join(" ")}`,
    ruleBasedScores: args.ruleBasedScores,
    continuityEmbodimentId: args.continuityEmbodimentId,
  });

  const semanticFitByEmbodiment: Record<string, number> = {};
  const continuityBonusByEmbodiment: Record<string, number> = {};
  const semanticExplainByEmbodiment: Record<string, { anchors: string[]; boundaries: string[]; reasons: string[] }> = {};

  for (const s of scored) {
    semanticFitByEmbodiment[s.embodimentId] = s.semanticFitScore;
    continuityBonusByEmbodiment[s.embodimentId] = s.continuityScore;
    semanticExplainByEmbodiment[s.embodimentId] = { anchors: s.anchors, boundaries: s.boundaries, reasons: s.explain };
  }

  return { semanticFitByEmbodiment, continuityBonusByEmbodiment, semanticExplainByEmbodiment };
}

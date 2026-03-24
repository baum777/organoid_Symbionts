import type { EmbodimentSemanticStore, EmbodimentSemanticQuery } from "../memoryTypes.js";
import type { EmbodimentSemanticRecord } from "../types.js";

function scoreTextMatch(recordText: string, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;
  const low = recordText.toLowerCase();
  const hits = terms.reduce((acc, term) => (low.includes(term) ? acc + 1 : acc), 0);
  return hits / terms.length;
}

export class InMemoryEmbodimentSemanticStore implements EmbodimentSemanticStore {
  private readonly records = new Map<string, EmbodimentSemanticRecord>();

  async upsert(records: EmbodimentSemanticRecord[]): Promise<void> {
    for (const record of records) this.records.set(record.id, record);
  }

  async query(args: EmbodimentSemanticQuery): Promise<EmbodimentSemanticRecord[]> {
    const limit = args.limit ?? 8;
    const filtered = Array.from(this.records.values()).filter((r) => {
      if (!args.includeInactive && r.metadata.active === false) return false;
      if (args.embodimentId && r.embodimentId !== args.embodimentId) return false;
      if (args.namespaces?.length && !args.namespaces.includes(r.namespace)) return false;
      if (args.docTypes?.length && !args.docTypes.includes(r.docType)) return false;
      return true;
    });

    return filtered
      .map((r) => ({ record: r, score: scoreTextMatch(r.text, args.queryText) + (r.metadata.retrievalPriority ?? 0) * 0.1 }))
      .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
      .slice(0, limit)
      .map((x) => x.record);
  }
}

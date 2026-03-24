/**
 * Embodiment Memory — Embodiment-specific memory snippets
 *
 * Retrieves relevance-ranked, bounded memory items for the selected embodiment.
 * Phase-1: In-memory minimal implementation; Phase-3 adds ranking by
 * relevance, recency, embodiment affinity.
 */

export interface MemoryItem {
  id: string;
  embodiment_id: string;
  user_id?: string;
  content: string;
  topic?: string;
  created_at: string;
  relevance_score?: number;
}

export interface EmbodimentMemoryStore {
  /** Get recent memory items for embodiment (and optionally user). Bounded by limit. */
  getItems(opts: {
    embodimentId: string;
    userId?: string;
    topic?: string;
    limit?: number;
  }): Promise<MemoryItem[]>;
  /** Add memory item (bounded, non-sensitive only). */
  addItem(item: Omit<MemoryItem, "id" | "created_at">): Promise<MemoryItem>;
}

/** In-memory implementation for Phase-1. */
class InMemoryEmbodimentMemory implements EmbodimentMemoryStore {
  private items: MemoryItem[] = [];
  private idCounter = 0;

  /** Phase-3: Ranking score = relevance*0.5 + recency*0.3 + embodiment_affinity*0.2 */
  async getItems(opts: {
    embodimentId: string;
    userId?: string;
    topic?: string;
    limit?: number;
    embodimentAffinity?: number; // 0..1
  }): Promise<MemoryItem[]> {
    let list = this.items.filter((m) => m.embodiment_id === opts.embodimentId);
    if (opts.userId) list = list.filter((m) => m.user_id === opts.userId);
    if (opts.topic) list = list.filter((m) => m.topic === opts.topic);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const withRank = list.map((m) => {
      const recency = Math.max(0, 1 - (now - new Date(m.created_at).getTime()) / maxAge);
      const relevance = m.relevance_score ?? 0.5;
      const embodimentAff = opts.embodimentAffinity ?? 0.5;
      const rank = relevance * 0.5 + recency * 0.3 + embodimentAff * 0.2;
      return { item: m, rank };
    });
    withRank.sort((a, b) => b.rank - a.rank);
    const limit = opts.limit ?? 5;
    return withRank.slice(0, limit).map((x) => x.item);
  }

  async addItem(item: Omit<MemoryItem, "id" | "created_at">): Promise<MemoryItem> {
    const full: MemoryItem = {
      ...item,
      id: `mem_${++this.idCounter}`,
      created_at: new Date().toISOString(),
    };
    this.items.push(full);
    return full;
  }
}

let defaultStore: EmbodimentMemoryStore | null = null;

/** Get default in-memory store (for Phase-1). */
export function getEmbodimentMemoryStore(): EmbodimentMemoryStore {
  if (!defaultStore) defaultStore = new InMemoryEmbodimentMemory();
  return defaultStore;
}

/** Reset store (for tests). */
export function resetEmbodimentMemoryStore(): void {
  defaultStore = null;
}

/**
 * User Affinity Store — User-Embodiment relationship signals
 *
 * Lightweight signals for routing: familiarity, preferred embodiment, etc.
 * Phase-1: In-memory; Phase-2/3 wire to DB (user_embodiment_affinity).
 */

/** Phase-3: Relationship arc signals (0..1) */
export interface RelationshipArcs {
  familiarity: number;
  rivalry?: number;
  playful_banter?: number;
  respect?: number;
  hostility?: number;
  inside_jokes?: number;
}

export interface UserEmbodimentAffinity {
  user_id: string;
  embodiment_id: string;
  familiarity: number;
  last_interaction_at: string;
  interaction_count: number;
  /** Phase-3: Extended relationship arcs */
  arcs?: RelationshipArcs;
}

export interface UserAffinityStore {
  /** Get affinity for user-embodiment pair. */
  getAffinity(userId: string, embodimentId: string): Promise<UserEmbodimentAffinity | null>;
  /** Update after successful interaction (conservative increment). */
  recordInteraction(
    userId: string,
    embodimentId: string,
    opts?: { incrementFamiliarity?: boolean },
  ): Promise<void>;
}

class InMemoryUserAffinityStore implements UserAffinityStore {
  private map = new Map<string, UserEmbodimentAffinity>();

  private key(userId: string, embodimentId: string): string {
    return `${userId}:${embodimentId}`;
  }

  async getAffinity(userId: string, embodimentId: string): Promise<UserEmbodimentAffinity | null> {
    return this.map.get(this.key(userId, embodimentId)) ?? null;
  }

  async recordInteraction(
    userId: string,
    embodimentId: string,
    opts?: { incrementFamiliarity?: boolean },
  ): Promise<void> {
    const k = this.key(userId, embodimentId);
    const now = new Date().toISOString();
    const existing = this.map.get(k);
    const inc = opts?.incrementFamiliarity !== false;
    const newFamiliarity = Math.min(
      1,
      (existing?.familiarity ?? 0) + (inc ? 0.05 : 0),
    );
    this.map.set(k, {
      user_id: userId,
      embodiment_id: embodimentId,
      familiarity: newFamiliarity,
      last_interaction_at: now,
      interaction_count: (existing?.interaction_count ?? 0) + 1,
    });
  }
}

let defaultStore: UserAffinityStore | null = null;

export function getUserAffinityStore(): UserAffinityStore {
  if (!defaultStore) defaultStore = new InMemoryUserAffinityStore();
  return defaultStore;
}

/** Reset (for tests). */
export function resetUserAffinityStore(): void {
  defaultStore = null;
}

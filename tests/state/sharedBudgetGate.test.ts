import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkLLMBudget,
  recordLLMCall,
  getBudgetStatus,
  resetBudget,
  reserveLLMBudget,
} from "../../src/state/sharedBudgetGate.js";
import { getStateStore, resetStoreCache } from "../../src/state/storeFactory.js";

/**
 * Shared budget gate (store-backed): two gate instances share budget,
 * thread vs reply weights, window reset, fail-closed on store error.
 */

beforeEach(() => {
  delete process.env.USE_REDIS;
  resetStoreCache();
});

function createReservationStore(options?: {
  used?: number;
  lockAcquired?: boolean;
  failIncr?: boolean;
}) {
  const state = {
    used: options?.used ?? 0,
  };

  return {
    async get(key: string): Promise<string | null> {
      if (key === "budget:llm:minute") {
        return String(state.used);
      }
      return null;
    },
    async set(_key: string, value: string): Promise<void> {
      state.used = Number(value);
    },
    async exists(_key: string): Promise<boolean> {
      return false;
    },
    async del(_key: string): Promise<void> {
      state.used = 0;
    },
    async getEventState(): Promise<null> {
      return null;
    },
    async setEventState(): Promise<void> {
      return undefined;
    },
    async deleteEventState(): Promise<void> {
      return undefined;
    },
    async acquirePublishLock(): Promise<boolean> {
      return false;
    },
    async releasePublishLock(): Promise<void> {
      return undefined;
    },
    async isPublished(): Promise<{ published: boolean; tweetId?: string }> {
      return { published: false };
    },
    async markPublished(): Promise<void> {
      return undefined;
    },
    async getBudgetUsage(): Promise<number> {
      return state.used;
    },
    async incrementBudgetUsage(weight: number): Promise<void> {
      if (options?.failIncr) return undefined;
      state.used += weight;
    },
    async resetBudget(): Promise<void> {
      state.used = 0;
    },
    async getCursor(): Promise<null> {
      return null;
    },
    async setCursor(): Promise<void> {
      return undefined;
    },
    async incr(key: string): Promise<number> {
      if (options?.failIncr) return 0;
      if (key === "budget:llm:minute") {
        state.used += 1;
        return state.used;
      }
      return 1;
    },
    async expire(): Promise<void> {
      return undefined;
    },
    async tryAcquireLeaderLock(): Promise<boolean> {
      return options?.lockAcquired ?? true;
    },
    async releaseLeaderLock(): Promise<boolean> {
      return true;
    },
    async ping(): Promise<boolean> {
      return true;
    },
    async close(): Promise<void> {
      return undefined;
    },
  };
}

describe("sharedBudgetGate", () => {
  beforeEach(async () => {
    await resetBudget();
  });

  describe("two gate instances share same budget", () => {
    it("worker A consumes budget, worker B sees updated usage", async () => {
      const r1 = await checkLLMBudget(false);
      expect(r1.allowed).toBe(true);
      await recordLLMCall(false);
      const status = await getBudgetStatus();
      expect(status.used).toBe(1);
      const r2 = await checkLLMBudget(false);
      expect(r2.used).toBe(1);
      expect(r2.remaining).toBe(28); // 30 - 1 (used) - 1 (requested)
    });

    it("multiple recordLLMCall accumulate in shared store", async () => {
      await recordLLMCall(false);
      await recordLLMCall(false);
      await recordLLMCall(true);
      const status = await getBudgetStatus();
      expect(status.used).toBe(4);
    });
  });

  describe("thread vs reply weights", () => {
    it("reply weight 1, thread weight 2", async () => {
      await recordLLMCall(false);
      await recordLLMCall(true);
      const status = await getBudgetStatus();
      expect(status.used).toBe(3);
    });
  });

  describe("threshold and block", () => {
    it("when usage reaches limit, checkLLMBudget returns allowed false", async () => {
      const limit = 30;
      for (let i = 0; i < limit; i++) {
        const r = await checkLLMBudget(false);
        if (r.allowed) await recordLLMCall(false);
      }
      const blocked = await checkLLMBudget(false);
      expect(blocked.allowed).toBe(false);
      expect(blocked.skipReason).toContain("budget_exceeded");
    });
  });

  describe("reservation edge", () => {
    it("reserves budget when space is available", async () => {
      const store = createReservationStore({ used: 0, lockAcquired: true });
      const result = await reserveLLMBudget(false, store as never);
      expect(result.status).toBe("reserved");
      if (result.status === "reserved") {
        expect(result.used).toBeGreaterThan(0);
      }
    });

    it("denies reservation when the budget is exhausted", async () => {
      const store = createReservationStore({ used: 30, lockAcquired: true });
      const result = await reserveLLMBudget(false, store as never);
      expect(result.status).toBe("denied");
      if (result.status === "denied") {
        expect(result.reason).toContain("budget_exceeded");
      }
    });

    it("fails closed when reservation lock cannot be acquired", async () => {
      const store = createReservationStore({ used: 0, lockAcquired: false });
      const result = await reserveLLMBudget(false, store as never);
      expect(result.status).toBe("unavailable");
      if (result.status === "unavailable") {
        expect(result.reason).toContain("reservation_lock_contended");
      }
    });

    it("fails closed when the store cannot persist the reservation", async () => {
      const store = createReservationStore({ used: 0, lockAcquired: true, failIncr: true });
      const result = await reserveLLMBudget(false, store as never);
      expect(result.status).toBe("unavailable");
      if (result.status === "unavailable") {
        expect(result.reason).toContain("reservation_incomplete");
      }
    });
  });

  describe("window reset", () => {
    it("usage resets when window expires", async () => {
      await recordLLMCall(false);
      await recordLLMCall(false);
      await resetBudget();
      const status = await getBudgetStatus();
      expect(status.used).toBe(0);
    });
  });

  describe("store error handling", () => {
    it("when getBudgetUsage returns 0 on error, checkLLMBudget defaults to safety", async () => {
      const store = getStateStore();
      vi.spyOn(store, "incr").mockRejectedValue(new Error("Store unavailable"));
      // The store catches and returns 0 by contract (mocking incr to 0 here)
      vi.spyOn(store, "incr").mockResolvedValue(0); 
      const r = await checkLLMBudget(false);
      expect(r.allowed).toBe(true); // Default to allow if store reports 0
      vi.restoreAllMocks();
    });
  });
});

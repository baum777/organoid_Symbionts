/**
 * Cameo Selector — Choose cameo embodiments for swarm replies
 *
 * Phase-3: Selects secondary embodiments when swarm mode is active.
 */

export interface CameoContext {
  primaryEmbodimentId: string;
  conversationEnergy: number;
  absurdityScore: number;
  availableEmbodiments: string[];
}

/** Select up to maxCameos secondary embodiments. */
export function selectCameos(
  ctx: CameoContext,
  opts?: { maxCameos?: number; energyThreshold?: number },
): string[] {
  const max = opts?.maxCameos ?? 2;
  const threshold = opts?.energyThreshold ?? 0.7;
  if (ctx.conversationEnergy < threshold || ctx.absurdityScore < 0.5)
    return [];
  const others = ctx.availableEmbodiments.filter((g) => g !== ctx.primaryEmbodimentId);
  return others.slice(0, max);
}

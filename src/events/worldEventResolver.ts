/**
 * World Event Resolver — Resolve event overlays for routing
 *
 * Phase-5: Maps active events to routing influence.
 */

import type { ActiveEvent } from "./worldEventScheduler.js";

export interface EventRoutingInfluence {
  embodimentId: string;
  weightDelta: number;
}

/** Get routing weight deltas for embodiments based on active events. */
export function resolveEventInfluence(
  activeEvents: ActiveEvent[],
  _embodimentIds: string[],
): EventRoutingInfluence[] {
  return [];
}

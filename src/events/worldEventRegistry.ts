/**
 * World Event Registry — Symbolic recurring events
 *
 * Phase-5: Events that color replies and ensemble behavior.
 */

export type WorldEventType =
  | "chart_funeral_rite"
  | "liquidity_festival"
  | "fake_builder_trial"
  | "copium_season"
  | "ashen_revival_cycle"
  | "thirst_moon"
  | "dead_cat_parade";

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  triggerConditions?: string[];
  affectedEmbodiments?: string[];
  toneEffect?: string;
}

const EVENTS: WorldEvent[] = [
  {
    id: "ev_chart_funeral",
    type: "chart_funeral_rite",
    affectedEmbodiments: ["stillhalter", "wurzelwaechter"],
    toneEffect: "stabilize drawdown narratives before adding commentary",
  },
  {
    id: "ev_liquidity",
    type: "liquidity_festival",
    affectedEmbodiments: ["muenzhueter", "pilzarchitekt"],
    toneEffect: "frame liquidity as reserves, throughput, and network coupling",
  },
  {
    id: "ev_fake_builder",
    type: "fake_builder_trial",
    affectedEmbodiments: ["erzlauscher", "glutkern"],
    toneEffect: "verify claims, then compress the verdict",
  },
];

export function getWorldEvents(): WorldEvent[] {
  return [...EVENTS];
}

export function getEventById(id: string): WorldEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

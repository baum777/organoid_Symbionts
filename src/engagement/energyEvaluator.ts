export type EnergyBand = "E0" | "E1" | "E2" | "E3";

export type EnergyInput = {
  directness: number;
  intent: number;
  relevance: number;
  freshness: number;
  legitimacy: number;
  friction: number;
};

export type EnergyScore = {
  total: number;
  band: EnergyBand;
  breakdown: {
    directness: number;
    intent: number;
    relevance: number;
    freshness: number;
    legitimacy: number;
    friction: number;
  };
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(4, value));
}

export function evaluateEnergy(input: EnergyInput): EnergyScore {
  const breakdown = {
    directness: clampScore(input.directness),
    intent: clampScore(input.intent),
    relevance: clampScore(input.relevance),
    freshness: clampScore(input.freshness),
    legitimacy: clampScore(input.legitimacy),
    friction: clampScore(input.friction),
  };

  const total =
    0.30 * breakdown.directness +
    0.25 * breakdown.intent +
    0.20 * breakdown.relevance +
    0.15 * breakdown.freshness +
    0.10 * breakdown.legitimacy -
    0.25 * breakdown.friction;

  let band: EnergyBand = "E0";
  if (total >= 3.0) band = "E3";
  else if (total >= 2.0) band = "E2";
  else if (total >= 1.0) band = "E1";

  return {
    total: Math.max(0, Number(total.toFixed(4))),
    band,
    breakdown,
  };
}

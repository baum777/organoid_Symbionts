export type TemplateKey =
  | "ORGANOID_ON_SOL_courtroom"
  | "ORGANOID_ON_SOL_chart_autopsy"
  | "ORGANOID_ON_SOL_ghost"
  | "ORGANOID_ON_SOL_certificate"
  | "ORGANOID_ON_SOL_trade_screen";

export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "MYTHIC" | "COMBO";

export type RarityConfig = {
  weights: Record<Exclude<Rarity, "COMBO">, number>;
  templatePools: Record<Exclude<Rarity, "COMBO">, TemplateKey[]>;
  caps?: Partial<Record<Exclude<Rarity, "COMBO">, number>>;
};

export function resolveTemplateKey(key: string): TemplateKey {
  return key as TemplateKey;
}

export const DEFAULT_RARITY_CONFIG: RarityConfig = {
  weights: { COMMON: 70, UNCOMMON: 20, RARE: 7, EPIC: 2.5, MYTHIC: 0.5 },
  templatePools: {
    COMMON: ["ORGANOID_ON_SOL_trade_screen"],
    UNCOMMON: ["ORGANOID_ON_SOL_courtroom"],
    RARE: ["ORGANOID_ON_SOL_chart_autopsy"],
    EPIC: ["ORGANOID_ON_SOL_certificate"],
    MYTHIC: ["ORGANOID_ON_SOL_ghost"]
  },
  caps: { EPIC: 1, MYTHIC: 1 }
};

import type { EmbodimentProfile } from "../embodiments/types.js";

export type EmbodimentMemoryLayer = "core" | "semantic" | "episodic" | "reflective";

export interface CoreEmbodimentLayer {
  layer: "core";
  profile: EmbodimentProfile;
  source: "yaml";
}

export type EmbodimentSemanticDocType =
  | "embodiment_core"
  | "embodiment_style_anchor"
  | "embodiment_activation_rule"
  | "embodiment_negative_boundary"
  | "embodiment_example"
  | "embodiment_relation"
  | "lore_chunk";

export type EmbodimentSemanticRecord = {
  id: string;
  embodimentId: string;
  namespace:
    | "embodiments-core"
    | "embodiments-style"
    | "embodiments-examples"
    | "embodiments-relations"
    | "lore-active"
    | "memory-episodic";
  docType: EmbodimentSemanticDocType;
  text: string;
  metadata: {
    role: string;
    archetype: string;
    loreTags?: string[];
    intents?: string[];
    energy?: "low" | "mid" | "high";
    safetyCritical?: boolean;
    relationTarget?: string;
    relationType?: "complements" | "suppresses" | "escalates_with" | "stabilizes_with";
    exampleQuality?: "gold" | "silver" | "bronze";
    sourceType?: "yaml" | "lore" | "example" | "reflection";
    active?: boolean;
    version: string;
    retrievalPriority?: number;
    derivedFrom?: string;
  };
};

export interface SemanticEmbodimentLayer {
  layer: "semantic";
  records: EmbodimentSemanticRecord[];
}

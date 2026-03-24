import type { EmbodimentSemanticRecord } from "./types.js";

export type EmbodimentEpisode = {
  id: string;
  embodimentId: string;
  userId?: string;
  threadId?: string;
  topicTags?: string[];
  interactionText: string;
  responseText: string;
  qualitySignals?: {
    accepted?: boolean;
    useful?: boolean;
    inEmbodiment?: boolean;
    driftRisk?: number;
  };
  createdAt: string;
};

export type ReflectionDecision = "retain" | "discard";
export type PromotionState = "none" | "promoted" | "rejected";

export interface EmbodimentReflection {
  episodeId: string;
  embodimentId: string;
  qualityScore: number;
  inEmbodimentScore: number;
  utilityScore: number;
  driftRisk: number;
  retentionDecision: ReflectionDecision;
  promotionState: PromotionState;
  reasoning: string[];
  createdAt: string;
}

export interface EpisodicMemoryLayer {
  layer: "episodic";
  episodes: EmbodimentEpisode[];
}

export interface ReflectiveCurationLayer {
  layer: "reflective";
  reflections: EmbodimentReflection[];
}

export interface EmbodimentSemanticQuery {
  queryText: string;
  embodimentId?: string;
  namespaces?: EmbodimentSemanticRecord["namespace"][];
  docTypes?: EmbodimentSemanticRecord["docType"][];
  limit?: number;
  includeInactive?: boolean;
}

export interface EmbodimentSemanticStore {
  upsert(records: EmbodimentSemanticRecord[]): Promise<void>;
  query(args: EmbodimentSemanticQuery): Promise<EmbodimentSemanticRecord[]>;
}

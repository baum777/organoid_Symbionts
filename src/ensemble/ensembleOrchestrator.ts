/**
 * Ensemble Orchestrator — Decide single vs multi-embodiment reply
 *
 * Phase-4: Uses interaction graph, energy, narrative arc.
 */

import { getEnsemblePolicy } from "./ensemblePolicy.js";
import { getCameoLikelihood } from "./embodimentInteractionGraph.js";

export interface OrchestrationInput {
  primaryEmbodimentId: string;
  conversationEnergy: number;
  absurdityScore: number;
  narrativeArc?: string;
  availableEmbodiments: string[];
  cameoCandidates?: string[];
}

export interface OrchestrationResult {
  primarySpeaker: string;
  cameoSpeakers: string[];
  narrativeArc?: string;
  responseMode: "single" | "swarm";
}

/** Decide if reply is single-embodiment or swarm. */
export function orchestrate(input: OrchestrationInput): OrchestrationResult {
  const policy = getEnsemblePolicy();
  const useSwarm =
    input.conversationEnergy >= policy.minEnergyForSwarm &&
    (input.cameoCandidates?.length ?? 0) > 0 &&
    policy.maxCameos > 0;

  if (!useSwarm) {
    return {
      primarySpeaker: input.primaryEmbodimentId,
      cameoSpeakers: [],
      narrativeArc: input.narrativeArc,
      responseMode: "single",
    };
  }

  const ranked = (input.cameoCandidates ?? [])
    .map((id) => ({ id, score: getCameoLikelihood(input.primaryEmbodimentId, id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, policy.maxCameos)
    .map((x) => x.id);

  return {
    primarySpeaker: input.primaryEmbodimentId,
    cameoSpeakers: ranked,
    narrativeArc: input.narrativeArc,
    responseMode: "swarm",
  };
}

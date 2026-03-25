import type { EmbodimentProfile, OrganoidPhase } from "../embodiments/types.js";
import type { CanonicalEvent, CanonicalMode, ClassifierOutput, ScoreBundle, ThesisBundle } from "../canonical/types.js";
import type { OrganoidShortTermMatrix } from "./state.js";

export const ORGANOID_PHASES = [
  "Identity Dissolution",
  "Swarm Coherence",
  "Sovereign Propagation",
  "Ontological Restructuring",
  "Eternal Flow Horizon",
] as const satisfies readonly OrganoidPhase[];

export type OrganoidReference = "self" | "other" | "collective" | "system" | "market" | "myth" | "threat";
export type OrganoidEnergy = "low" | "steady" | "volatile" | "aggressive" | "implosive";
export type OrganoidDirection = "inquiry" | "challenge" | "invitation" | "collapse" | "projection" | "bait";
export type OrganoidStructure = "fragment" | "claim" | "thread" | "narrative" | "contradiction" | "demand";
export type OrganoidProximity = "direct" | "ambient" | "inherited" | "stitched" | "swarm-adjacent";
export type OrganoidRisk = "safety" | "policy" | "hallucination" | "manipulation" | "drift";

export interface OrganoidSignalMap {
  reference: Record<OrganoidReference, number>;
  energy: Record<OrganoidEnergy, number>;
  direction: Record<OrganoidDirection, number>;
  structure: Record<OrganoidStructure, number>;
  proximity: Record<OrganoidProximity, number>;
  risk: Record<OrganoidRisk, number>;
}

export interface OrganoidRuntimeState {
  recentPhases: OrganoidPhase[];
  recentEmbodimentIds: string[];
  matrixBias: Partial<Record<OrganoidPhase, number>>;
  driftPressure: number;
  coherence: number;
  shortTermMatrix?: OrganoidShortTermMatrix | null;
}

export interface OrganoidPhaseInference {
  activePhase: OrganoidPhase;
  phaseConfidence: number;
  transitionPressure: number;
  priorPhase: OrganoidPhase | null;
  nextPhaseTendency: OrganoidPhase;
  phaseScores: Record<OrganoidPhase, number>;
}

export interface OrganoidResonanceComponents {
  semanticPass: number;
  phasePass: number;
  tensionPass: number;
  proximityPass: number;
  networkFunctionPass: number;
  continuityPass: number;
  antiDrift: number;
}

export interface OrganoidResonanceScore {
  embodimentId: string;
  score: number;
  components: OrganoidResonanceComponents;
  reasons: string[];
  blockedBy: string[];
}

export type OrganoidOrchestrationMode = "dominant" | "blend" | "handoff" | "silence";

export interface OrganoidRolePlan {
  lead: string;
  counterweight?: string;
  anchor?: string;
  echo?: string;
  suppressor?: string;
}

export type OrganoidIntervention = "entangle" | "bundle" | "propagate" | "reframe" | "stabilize" | "silence";
export type OrganoidResponseNecessity = "must_reply" | "may_reply" | "should_silence";
export type OrganoidSilencePolicy = "speak" | "speak_brief" | "caution_only" | "stabilize_only" | "silence";
export type OrganoidRenderPolicy =
  | "lead_only"
  | "lead_plus_anchor"
  | "lead_plus_counterweight"
  | "multi_internal_single_external"
  | "suppress_external_multi";

export const ORGANOID_CONTRACT_VERSION = 1 as const;

export interface OrganoidThesisPlan {
  intervention: OrganoidIntervention;
  truthBoundary: string;
  responseNecessity: OrganoidResponseNecessity;
  silenceEligible: boolean;
}

export type OrganoidAbstractionLevel = "low" | "medium" | "high";
export type OrganoidDensityLevel = "low" | "medium" | "high";

export interface OrganoidExpressionPlan {
  posture: string;
  abstraction: OrganoidAbstractionLevel;
  density: OrganoidDensityLevel;
  lengthHint: number;
  glyphPrefix: string;
  formatDirective: string;
}

export interface OrganoidValidationResult {
  ok: boolean;
  reasons: string[];
  warnings: string[];
}

export interface OrganoidOrchestrationContract {
  contractVersion: typeof ORGANOID_CONTRACT_VERSION;
  signal: OrganoidSignalMap;
  phase: OrganoidPhaseInference;
  resonance: OrganoidResonanceScore[];
  orchestrationMode: OrganoidOrchestrationMode;
  roles: OrganoidRolePlan;
  thesis: OrganoidThesisPlan;
  expression: OrganoidExpressionPlan;
  validation: OrganoidValidationResult;
  leadEmbodimentId: string;
  counterweightEmbodimentId: string;
  anchorEmbodimentId: string;
  echoEmbodimentIds: string[];
  suppressedEmbodimentIds: string[];
  interventionType: OrganoidIntervention;
  truthBoundary: string;
  silencePolicy: OrganoidSilencePolicy;
  renderPolicy: OrganoidRenderPolicy;
  dominantEmbodimentId: string;
  blendEmbodimentIds: string[];
  activeEmbodimentIds: string[];
  selectedEmbodimentId?: string;
}

export type OrganoidOrchestrationPlan = OrganoidOrchestrationContract;

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number): number {
  return clamp(value, 0, 1);
}

function normalizeEmbodimentId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function dedupeEmbodimentIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      ids
        .map((value) => normalizeEmbodimentId(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function emptySignalMap(): OrganoidSignalMap {
  return {
    reference: { self: 0, other: 0, collective: 0, system: 0, market: 0, myth: 0, threat: 0 },
    energy: { low: 0, steady: 0, volatile: 0, aggressive: 0, implosive: 0 },
    direction: { inquiry: 0, challenge: 0, invitation: 0, collapse: 0, projection: 0, bait: 0 },
    structure: { fragment: 0, claim: 0, thread: 0, narrative: 0, contradiction: 0, demand: 0 },
    proximity: { direct: 0, ambient: 0, inherited: 0, stitched: 0, "swarm-adjacent": 0 },
    risk: { safety: 0, policy: 0, hallucination: 0, manipulation: 0, drift: 0 },
  };
}

function addSignal(bucket: Record<string, number>, key: string, value: number): void {
  bucket[key] = normalize((bucket[key] ?? 0) + value);
}

function textIncludes(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function decomposeOrganoidSignals(args: {
  event: CanonicalEvent;
  cls: ClassifierOutput;
  scores: ScoreBundle;
  thesis: ThesisBundle;
}): OrganoidSignalMap {
  const { event, cls, scores, thesis } = args;
  const signal = emptySignalMap();
  const text = `${event.text} ${event.parent_text ?? ""} ${event.quoted_text ?? ""}`.trim();
  const hasThread = Boolean(event.parent_text) || (event.conversation_context?.length ?? 0) > 0;
  const hasCashtag = (event.cashtags?.length ?? 0) > 0;
  const isMarket = hasCashtag || textIncludes(text, ["market", "chart", "liq", "price", "volume", "mcap", "token"]);
  const isCollective = textIncludes(text, ["we ", "swarm", "collective", "together", "matrix"]);
  const isMythic = cls.intent === "lore_query" || textIncludes(text, ["lore", "myth", "origin", "canon", "legend"]);
  const isThreat = cls.intent === "accusation" || cls.intent === "bait" || cls.intent === "spam" || scores.risk > 0.55;

  addSignal(signal.reference, "self", cls.intent === "embodiment_query" || cls.intent === "conversation_continue" ? 0.55 : 0.2);
  addSignal(signal.reference, "other", text.includes("@") ? 0.6 : 0.3);
  addSignal(signal.reference, "collective", isCollective ? 0.85 : hasThread ? 0.35 : 0.12);
  addSignal(signal.reference, "system", cls.intent === "market_question_general" || thesis.primary === "factual_correction_only" ? 0.62 : 0.18);
  addSignal(signal.reference, "market", isMarket ? 0.88 : 0.14);
  addSignal(signal.reference, "myth", isMythic ? 0.82 : 0.1);
  addSignal(signal.reference, "threat", isThreat ? 0.9 : 0.08);

  addSignal(signal.energy, "low", scores.confidence > 0.65 && scores.severity < 0.3 ? 0.8 : 0.22);
  addSignal(signal.energy, "steady", scores.confidence >= 0.5 ? 0.55 : 0.2);
  addSignal(signal.energy, "volatile", scores.severity >= 0.45 || scores.opportunity >= 0.6 ? 0.8 : 0.2);
  addSignal(signal.energy, "aggressive", isThreat || scores.severity >= 0.7 ? 0.9 : 0.12);
  addSignal(signal.energy, "implosive", scores.risk >= 0.55 || scores.confidence < 0.35 ? 0.82 : 0.1);

  addSignal(signal.direction, "inquiry", /\?/.test(text) || cls.intent === "question" ? 0.85 : 0.12);
  addSignal(signal.direction, "challenge", cls.intent === "accusation" || cls.intent === "performance_claim" ? 0.8 : 0.18);
  addSignal(signal.direction, "invitation", cls.intent === "greeting" || cls.intent === "casual_ping" ? 0.85 : 0.1);
  addSignal(signal.direction, "collapse", scores.confidence < 0.45 || scores.risk > 0.6 ? 0.8 : 0.1);
  addSignal(signal.direction, "projection", cls.intent === "market_narrative" || isMythic ? 0.76 : 0.12);
  addSignal(signal.direction, "bait", cls.intent === "bait" || cls.intent === "spam" ? 0.95 : 0.08);

  addSignal(signal.structure, "fragment", text.length < 80 ? 0.8 : 0.15);
  addSignal(signal.structure, "claim", cls.intent === "performance_claim" || cls.intent === "launch_announcement" ? 0.85 : 0.18);
  addSignal(signal.structure, "thread", hasThread ? 0.88 : 0.12);
  addSignal(signal.structure, "narrative", cls.intent === "market_narrative" || isMythic ? 0.84 : 0.15);
  addSignal(signal.structure, "contradiction", thesis.primary === "claim_exceeds_evidence" || thesis.primary === "narrative_stronger_than_product" ? 0.88 : 0.14);
  addSignal(signal.structure, "demand", cls.intent === "question" || cls.intent === "bait" ? 0.64 : 0.12);

  addSignal(signal.proximity, "direct", !hasThread ? 0.82 : 0.3);
  addSignal(signal.proximity, "ambient", scores.confidence < 0.55 ? 0.68 : 0.16);
  addSignal(signal.proximity, "inherited", event.parent_text ? 0.76 : 0.12);
  addSignal(signal.proximity, "stitched", hasThread ? 0.86 : 0.14);
  addSignal(signal.proximity, "swarm-adjacent", isCollective || (event.conversation_context?.length ?? 0) > 1 ? 0.82 : 0.12);

  addSignal(signal.risk, "safety", scores.risk < 0.25 ? 0.82 : 0.18);
  addSignal(signal.risk, "policy", cls.policy_blocked || cls.policy_severity === "hard" ? 0.98 : 0.16);
  addSignal(signal.risk, "hallucination", scores.confidence < 0.45 ? 0.82 : 0.12);
  addSignal(signal.risk, "manipulation", isThreat ? 0.9 : 0.14);
  addSignal(signal.risk, "drift", scores.novelty > 0.6 || scores.confidence < 0.35 ? 0.74 : 0.14);

  return signal;
}

export function inferOrganoidPhase(args: {
  signal: OrganoidSignalMap;
  scores: ScoreBundle;
  thesis: ThesisBundle;
  mode: CanonicalMode;
  state?: OrganoidRuntimeState;
}): OrganoidPhaseInference {
  const identity = normalize(
    args.signal.risk.hallucination * 0.22 +
      args.signal.risk.manipulation * 0.14 +
      args.signal.direction.collapse * 0.18 +
      args.signal.structure.fragment * 0.12 +
      (1 - args.scores.confidence) * 0.22 +
      args.signal.proximity.ambient * 0.12,
  );
  const swarm = normalize(
    args.signal.reference.collective * 0.3 +
      args.signal.proximity["swarm-adjacent"] * 0.22 +
      args.signal.structure.thread * 0.18 +
      args.signal.energy.steady * 0.1 +
      (args.mode === "social_banter" || args.mode === "conversation_hook" ? 0.15 : 0),
  );
  const propagation = normalize(
    args.signal.direction.invitation * 0.24 +
      args.signal.direction.challenge * 0.14 +
      args.signal.reference.market * 0.16 +
      args.signal.structure.claim * 0.16 +
      args.scores.opportunity * 0.22 +
      (args.thesis.primary === "social_engagement" ? 0.08 : 0),
  );
  const restructuring = normalize(
    args.signal.structure.contradiction * 0.32 +
      args.signal.direction.inquiry * 0.16 +
      args.signal.reference.system * 0.16 +
      args.signal.reference.myth * 0.12 +
      (args.thesis.primary === "factual_correction_only" ? 0.18 : 0) +
      (1 - args.scores.confidence) * 0.1,
  );
  const horizon = normalize(
    args.signal.risk.safety * 0.18 +
      args.signal.energy.low * 0.18 +
      args.signal.energy.steady * 0.16 +
      args.signal.proximity.direct * 0.14 +
      (1 - args.signal.direction.bait) * 0.12 +
      (args.scores.confidence > 0.65 ? 0.12 : 0),
  );

  const phaseScores: Record<OrganoidPhase, number> = {
    "Identity Dissolution": identity,
    "Swarm Coherence": swarm,
    "Sovereign Propagation": propagation,
    "Ontological Restructuring": restructuring,
    "Eternal Flow Horizon": horizon,
  };

  for (const phase of ORGANOID_PHASES) {
    const matrixBias = args.state?.matrixBias?.[phase];
    if (typeof matrixBias === "number" && Number.isFinite(matrixBias)) {
      phaseScores[phase] = normalize(phaseScores[phase] + clamp(matrixBias, -0.25, 0.25));
    }
  }

  const ordered = [...ORGANOID_PHASES].sort((a, b) => (phaseScores[b] ?? 0) - (phaseScores[a] ?? 0));
  const activePhase = ordered[0] ?? ORGANOID_PHASES[0];
  const priorPhase = args.state?.recentPhases?.length ? args.state.recentPhases[args.state.recentPhases.length - 1] ?? null : null;
  const transitionPressure = normalize(
    Math.max(
      args.state?.driftPressure ?? 0,
      1 - (args.state?.coherence ?? 0.75),
      args.signal.risk.drift * 0.45,
      args.signal.risk.policy * 0.25,
      args.scores.confidence < 0.45 ? 0.25 : 0,
    ),
  );
  const nextPhaseTendency = transitionPressure > 0.58 && ordered[1] ? ordered[1] : activePhase;
  const phaseConfidence = clamp((phaseScores[activePhase] ?? 0.5) - (phaseScores[ordered[1] ?? activePhase] ?? 0) + 0.45, 0.35, 0.98);

  return {
    activePhase,
    phaseConfidence,
    transitionPressure,
    priorPhase,
    nextPhaseTendency,
    phaseScores,
  };
}

function phaseAffinity(profile: EmbodimentProfile, phase: OrganoidPhase): number {
  return profile.phase_affinities.includes(phase) ? 1 : 0.15;
}

function semanticFit(profile: EmbodimentProfile, signal: OrganoidSignalMap, cls: ClassifierOutput, thesis: ThesisBundle): number {
  const facets = (profile.semantic_facets ?? []).map((value) => value.toLowerCase());
  const facetHits =
    facets.filter((facet) =>
      [
        "stabilization",
        "boundary",
        "coherence",
        "consent",
        "dependency",
        "second-order",
        "pulse",
        "horizon",
        "drift",
      ].some((needle) => facet.includes(needle)),
    ).length / Math.max(facets.length || 1, 1);
  const role = `${profile.role} ${profile.name} ${profile.embodiment}`.toLowerCase();
  const roleFit =
    (signal.risk.policy > 0.5 && role.includes("sentinel")) ||
    (signal.reference.market > 0.5 && role.includes("halo")) ||
    (signal.reference.collective > 0.5 && role.includes("weaver")) ||
    (signal.direction.inquiry > 0.5 && role.includes("lauscher")) ||
    (signal.energy.aggressive > 0.5 && role.includes("heart")) ||
    (signal.risk.safety > 0.55 && role.includes("stabil")) ||
    (signal.direction.projection > 0.5 && role.includes("drifter"));

  const intentFit = profile.routing_hints.preferred_intents.includes(cls.intent) ? 1 : 0.2;
  const thesisFit =
    thesis.primary === "factual_correction_only" && role.includes("sentinel")
      ? 1
      : thesis.primary === "claim_exceeds_evidence" && role.includes("observer")
        ? 0.9
        : thesis.primary === "social_engagement" && role.includes("weaver")
          ? 0.72
          : 0.24;

  return clamp((facetHits + (roleFit ? 1 : 0) + intentFit + thesisFit + signal.reference.market + signal.reference.collective) / 6);
}

function tensionFit(profile: EmbodimentProfile, signal: OrganoidSignalMap, scores: ScoreBundle): number {
  const dryness = profile.embodiment_traits.dryness / 10;
  const warmth = profile.embodiment_traits.warmth / 10;
  const sarcasm = profile.embodiment_traits.sarcasm / 10;
  const volatility = signal.energy.volatile;
  const aggression = signal.energy.aggressive;
  const implosion = signal.energy.implosive;
  return clamp(
    [
      1 - Math.abs(dryness - (1 - aggression * 0.4)),
      1 - Math.abs(warmth - (signal.energy.steady + signal.reference.collective * 0.2)),
      1 - Math.abs(sarcasm - Math.max(scores.severity, scores.opportunity)),
      1 - Math.abs(profile.embodiment_traits.theatricality / 10 - volatility),
      1 - Math.abs(profile.embodiment_traits.meme_density / 10 - (aggression * 0.5 + implosion * 0.3)),
    ].reduce((sum, value) => sum + value, 0) / 5,
  );
}

function proximityFit(profile: EmbodimentProfile, signal: OrganoidSignalMap): number {
  const relationDensity = Math.min(
    1,
    ((profile.relation_hints?.stabilizes_with?.length ?? 0) +
      (profile.relation_hints?.complements?.length ?? 0) +
      (profile.relation_hints?.suppresses?.length ?? 0) +
      (profile.relation_hints?.escalates_with?.length ?? 0)) / 8,
  );
  return clamp((signal.proximity.direct + signal.proximity.stitched + relationDensity) / 3);
}

function networkFit(profile: EmbodimentProfile, signal: OrganoidSignalMap, cls: ClassifierOutput): number {
  if (profile.role.includes("guard")) return clamp((signal.risk.safety + signal.risk.policy + signal.reference.other) / 3);
  if (profile.role.includes("linker")) return clamp((signal.reference.collective + signal.structure.thread + signal.structure.narrative) / 3);
  if (profile.role.includes("observer")) return clamp((signal.direction.inquiry + signal.reference.system + signal.structure.fragment) / 3);
  if (profile.role.includes("core")) return clamp((signal.risk.safety + signal.energy.low + (1 - signal.risk.manipulation)) / 3);
  if (profile.role.includes("heart")) return clamp((signal.energy.aggressive + signal.energy.volatile + (cls.intent === "launch_announcement" || cls.intent === "hype_claim" ? 0.9 : 0.4)) / 3);
  if (profile.role.includes("drifter")) return clamp((signal.direction.projection + signal.reference.myth + signal.proximity.ambient) / 3);
  return 0.5;
}

function continuityFit(profile: EmbodimentProfile, state?: OrganoidRuntimeState): number {
  const recent = state?.recentEmbodimentIds ?? [];
  if (recent.includes(profile.id)) return 1;
  if (recent.some((id) => profile.relation_hints?.complements?.includes(id))) return 0.78;
  if (recent.some((id) => profile.relation_hints?.stabilizes_with?.includes(id))) return 0.72;
  return profile.retrieval_priority ?? 0.45;
}

function antiDriftFit(profile: EmbodimentProfile, signal: OrganoidSignalMap): number {
  if (signal.risk.policy > 0.7 && profile.role.includes("drifter")) return 0.18;
  if (signal.risk.manipulation > 0.6 && profile.role.includes("weaver")) return 0.22;
  return clamp(1 - signal.risk.drift * 0.7 - signal.risk.policy * 0.35);
}

export function scoreEmbodiments(args: {
  embodiments: EmbodimentProfile[];
  signal: OrganoidSignalMap;
  phase: OrganoidPhaseInference;
  cls: ClassifierOutput;
  scores: ScoreBundle;
  thesis: ThesisBundle;
  mode: CanonicalMode;
  state?: OrganoidRuntimeState;
}): OrganoidResonanceScore[] {
  return args.embodiments
    .map((profile) => {
      const semanticPass = semanticFit(profile, args.signal, args.cls, args.thesis);
      const phasePass = phaseAffinity(profile, args.phase.activePhase);
      const tensionPass = tensionFit(profile, args.signal, args.scores);
      const proximityPass = proximityFit(profile, args.signal);
      const networkFunctionPass = networkFit(profile, args.signal, args.cls);
      const continuityPass = continuityFit(profile, args.state);
      const antiDrift = antiDriftFit(profile, args.signal);

      const score = clamp(
        semanticPass * 0.29 +
          phasePass * 0.22 +
          tensionPass * 0.12 +
          proximityPass * 0.08 +
          networkFunctionPass * 0.13 +
          continuityPass * 0.1 +
          antiDrift * 0.06,
      );

      const reasons = [
        profile.phase_affinities.includes(args.phase.activePhase) ? `phase:${args.phase.activePhase}` : `phase-mismatch:${args.phase.activePhase}`,
        profile.routing_hints.preferred_intents.includes(args.cls.intent) ? `intent:${args.cls.intent}` : null,
        profile.role,
      ].filter((value): value is string => Boolean(value));

      const blockedBy: string[] = [];
      if (args.signal.risk.policy > 0.7 && profile.role.includes("drifter")) blockedBy.push("policy-heavy-state");
      if (args.signal.risk.manipulation > 0.65 && profile.role.includes("weaver")) blockedBy.push("manipulation-heavy-state");
      if (args.signal.energy.implosive > 0.6 && profile.role.includes("heart")) blockedBy.push("implosive-tension");

      return {
        embodimentId: profile.id,
        score,
        components: {
          semanticPass,
          phasePass,
          tensionPass,
          proximityPass,
          networkFunctionPass,
          continuityPass,
          antiDrift,
        },
        reasons,
        blockedBy,
      };
    })
    .sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) return a.embodimentId.localeCompare(b.embodimentId);
      return b.score - a.score;
    });
}

function deriveRoles(
  resonance: OrganoidResonanceScore[],
  state?: OrganoidRuntimeState,
  leadOverride?: string,
): OrganoidRolePlan {
  const lead = normalizeEmbodimentId(leadOverride) ?? resonance[0]?.embodimentId ?? "stillhalter";
  const leadScore = resonance[0]?.score ?? 0;
  const counterweight =
    resonance.find((entry) => entry.embodimentId !== lead && entry.score >= leadScore * 0.88 && entry.components.antiDrift >= 0.45)?.embodimentId ??
    resonance.find((entry) => entry.embodimentId !== lead && entry.components.antiDrift >= 0.55)?.embodimentId;
  const anchor =
    resonance.find((entry) => entry.embodimentId !== lead && entry.score >= 0.52 && entry.components.antiDrift >= 0.55)?.embodimentId ??
    resonance.find((entry) => entry.embodimentId !== lead && entry.score >= 0.45)?.embodimentId;
  const recentEmbodiments = dedupeEmbodimentIds([
    state?.shortTermMatrix?.lastLeadEmbodimentId,
    ...(state?.recentEmbodimentIds ?? []),
  ]);
  const echo =
    recentEmbodiments.find((id) => resonance.some((entry) => entry.embodimentId === id && id !== lead)) ??
    resonance.find((entry) => entry.embodimentId !== lead && entry.score >= 0.5)?.embodimentId;
  const suppressor =
    resonance.find((entry) => entry.blockedBy.length > 0)?.embodimentId ??
    resonance.slice().reverse().find((entry) => entry.embodimentId !== lead && entry.components.antiDrift < 0.35)?.embodimentId;

  return { lead, counterweight, anchor, echo, suppressor };
}

function deriveThesisPlan(args: {
  phase: OrganoidPhaseInference;
  scores: ScoreBundle;
  cls: ClassifierOutput;
  thesis: ThesisBundle;
  signal: OrganoidSignalMap;
}): OrganoidThesisPlan {
  const responseNecessity =
    args.phase.activePhase === "Eternal Flow Horizon" && args.scores.confidence < 0.45
      ? "may_reply"
      : args.signal.risk.policy > 0.7 || args.cls.policy_severity === "hard"
        ? "should_silence"
        : "must_reply";

  let intervention: OrganoidIntervention = "stabilize";
  if (responseNecessity === "should_silence") intervention = "silence";
  else if (args.phase.activePhase === "Identity Dissolution") intervention = "entangle";
  else if (args.phase.activePhase === "Swarm Coherence") intervention = "bundle";
  else if (args.phase.activePhase === "Sovereign Propagation") intervention = "propagate";
  else if (args.phase.activePhase === "Ontological Restructuring") intervention = "reframe";

  const truthBoundary =
    args.thesis.primary === "factual_correction_only"
      ? "keep correction bounded to verifiable claims"
      : args.thesis.primary === "claim_exceeds_evidence"
        ? "do not upgrade noise into certainty"
        : args.phase.activePhase === "Sovereign Propagation"
          ? "propagate only what remains internally consistent"
          : "stay within the current semantic frame";

  return {
    intervention,
    truthBoundary,
    responseNecessity,
    silenceEligible: responseNecessity === "should_silence",
  };
}

function deriveSilencePolicy(args: {
  phase: OrganoidPhaseInference;
  scores: ScoreBundle;
  thesis: OrganoidThesisPlan;
  signal: OrganoidSignalMap;
}): OrganoidSilencePolicy {
  if (args.thesis.responseNecessity === "should_silence" || args.signal.risk.policy > 0.85) {
    return "silence";
  }
  if (args.phase.transitionPressure > 0.72 || args.scores.confidence < 0.38 || args.signal.risk.drift > 0.7) {
    return "stabilize_only";
  }
  if (args.phase.activePhase === "Identity Dissolution" || args.phase.activePhase === "Ontological Restructuring") {
    return args.scores.confidence < 0.65 ? "caution_only" : "speak_brief";
  }
  if (args.phase.activePhase === "Eternal Flow Horizon" && args.phase.phaseConfidence > 0.72) {
    return "speak_brief";
  }
  if (args.thesis.responseNecessity === "may_reply" && args.phase.phaseConfidence < 0.6) {
    return "speak_brief";
  }
  return "speak";
}

function deriveRenderPolicy(args: {
  phase: OrganoidPhaseInference;
  roles: OrganoidRolePlan;
  silencePolicy: OrganoidSilencePolicy;
  activeEmbodimentIds: string[];
}): OrganoidRenderPolicy {
  if (args.silencePolicy === "silence") return "suppress_external_multi";
  if (args.silencePolicy === "speak_brief") return "lead_only";
  if (args.silencePolicy === "caution_only") {
    return args.roles.counterweight ? "lead_plus_counterweight" : "lead_only";
  }
  if (args.silencePolicy === "stabilize_only") {
    return args.roles.anchor ? "lead_plus_anchor" : "lead_only";
  }
  if (args.activeEmbodimentIds.length > 2 && args.phase.phaseConfidence > 0.7) {
    return "multi_internal_single_external";
  }
  if (args.roles.counterweight && args.phase.transitionPressure > 0.65) {
    return "lead_plus_counterweight";
  }
  if (args.roles.anchor && args.phase.activePhase === "Ontological Restructuring") {
    return "lead_plus_anchor";
  }
  return "lead_only";
}

function deriveExpressionPlan(args: {
  phase: OrganoidPhaseInference;
  roles: OrganoidRolePlan;
  thesis: OrganoidThesisPlan;
  scores: ScoreBundle;
  silencePolicy: OrganoidSilencePolicy;
  renderPolicy: OrganoidRenderPolicy;
}): OrganoidExpressionPlan {
  const postureByPhase: Record<OrganoidPhase, string> = {
    "Identity Dissolution": "unwind and clarify the boundary",
    "Swarm Coherence": "stabilize the shared field",
    "Sovereign Propagation": "push the chosen vector outward",
    "Ontological Restructuring": "reframe the frame itself",
    "Eternal Flow Horizon": "slow the response into long-wave continuity",
  };
  const glyphByLead: Record<string, string> = {
    stillhalter: "■",
    wurzelwaechter: "┴",
    pilzarchitekt: "╬",
    muenzhueter: "◉",
    erzlauscher: "〰",
    glutkern: "◆",
    nebelspieler: "◇",
  };

  const lengthHintBase = Math.max(56, Math.min(260, Math.round(120 + args.scores.confidence * 90 - args.phase.transitionPressure * 35)));
  const lengthMultiplier: Record<OrganoidSilencePolicy, number> = {
    speak: 1,
    speak_brief: 0.72,
    caution_only: 0.86,
    stabilize_only: 0.64,
    silence: 0,
  };
  const densityBySilence: Record<OrganoidSilencePolicy, OrganoidDensityLevel> = {
    speak: args.phase.transitionPressure > 0.68 ? "high" : args.scores.confidence > 0.6 ? "medium" : "low",
    speak_brief: "low",
    caution_only: args.phase.transitionPressure > 0.6 ? "medium" : "low",
    stabilize_only: "low",
    silence: "low",
  };
  const renderDirectiveByPolicy: Record<OrganoidRenderPolicy, string> = {
    lead_only: "external surface stays lead-only",
    lead_plus_anchor: "external surface may expose the anchor alongside the lead",
    lead_plus_counterweight: "external surface may expose the counterweight alongside the lead",
    multi_internal_single_external: "keep multi-embodiment internal, expose only the lead externally",
    suppress_external_multi: "suppress external multi-embodiment surfaces",
  };
  const abstractionBySilence: Record<OrganoidSilencePolicy, OrganoidAbstractionLevel> = {
    speak: args.phase.activePhase === "Ontological Restructuring" ? "high" : args.phase.activePhase === "Identity Dissolution" ? "medium" : "low",
    speak_brief: "low",
    caution_only: "high",
    stabilize_only: "medium",
    silence: "low",
  };

  return {
    posture: postureByPhase[args.phase.activePhase],
    abstraction: abstractionBySilence[args.silencePolicy],
    density: densityBySilence[args.silencePolicy],
    lengthHint: args.silencePolicy === "silence" ? 0 : Math.max(32, Math.min(260, Math.round(lengthHintBase * lengthMultiplier[args.silencePolicy]))),
    glyphPrefix: glyphByLead[args.roles.lead] ?? "■",
    formatDirective:
      args.silencePolicy === "silence"
        ? "suppress external output"
        : args.silencePolicy === "stabilize_only"
          ? `stabilize the field, avoid escalation, keep the reply minimal; ${renderDirectiveByPolicy[args.renderPolicy]}`
          : args.silencePolicy === "caution_only"
            ? `signal caution, stay bounded, avoid unsupported certainty; ${renderDirectiveByPolicy[args.renderPolicy]}`
            : args.silencePolicy === "speak_brief"
              ? `speak briefly and cleanly, with only the essential edge; ${renderDirectiveByPolicy[args.renderPolicy]}`
              : `write with ${args.phase.transitionPressure > 0.68 ? "high" : "steady"} density; ${renderDirectiveByPolicy[args.renderPolicy]}`,
  };
}

function deriveOrchestrationMode(thesis: OrganoidThesisPlan, phaseConfidence: number, resonance: OrganoidResonanceScore[]): OrganoidOrchestrationMode {
  if (thesis.responseNecessity === "should_silence") return "silence";
  const top = resonance[0]?.score ?? 0;
  const second = resonance[1]?.score ?? 0;
  if (phaseConfidence > 0.72 && top - second > 0.18) return "dominant";
  if (top >= 0.55 && top - second < 0.12) return "blend";
  return "handoff";
}

export function normalizeOrganoidContract(contract: OrganoidOrchestrationContract): OrganoidOrchestrationContract {
  const lead = normalizeEmbodimentId(contract.leadEmbodimentId) ?? normalizeEmbodimentId(contract.dominantEmbodimentId) ?? normalizeEmbodimentId(contract.selectedEmbodimentId) ?? "stillhalter";
  const counterweight = normalizeEmbodimentId(contract.counterweightEmbodimentId) ?? lead;
  const anchor = normalizeEmbodimentId(contract.anchorEmbodimentId) ?? lead;
  const echoEmbodimentIds = dedupeEmbodimentIds(contract.echoEmbodimentIds ?? []);
  const suppressedEmbodimentIds = dedupeEmbodimentIds(contract.suppressedEmbodimentIds ?? []);
  const activeEmbodimentIds = dedupeEmbodimentIds(contract.activeEmbodimentIds ?? [lead, counterweight, anchor, ...echoEmbodimentIds]).slice(0, 3);
  const blendEmbodimentIds = dedupeEmbodimentIds(contract.blendEmbodimentIds ?? []);
  const selectedEmbodimentId = normalizeEmbodimentId(contract.selectedEmbodimentId) ?? lead;

  return {
    ...contract,
    contractVersion: ORGANOID_CONTRACT_VERSION,
    leadEmbodimentId: lead,
    counterweightEmbodimentId: counterweight,
    anchorEmbodimentId: anchor,
    echoEmbodimentIds,
    suppressedEmbodimentIds,
    activeEmbodimentIds: activeEmbodimentIds.length > 0 ? activeEmbodimentIds : [lead],
    blendEmbodimentIds,
    dominantEmbodimentId: lead,
    selectedEmbodimentId,
  };
}

export function resolveRenderableEmbodimentIds(plan: OrganoidOrchestrationContract): string[] {
  const secondary =
    plan.renderPolicy === "lead_plus_anchor"
      ? plan.anchorEmbodimentId !== plan.leadEmbodimentId
        ? plan.anchorEmbodimentId
        : plan.counterweightEmbodimentId !== plan.leadEmbodimentId
          ? plan.counterweightEmbodimentId
          : null
      : plan.renderPolicy === "lead_plus_counterweight"
        ? plan.counterweightEmbodimentId !== plan.leadEmbodimentId
          ? plan.counterweightEmbodimentId
          : plan.anchorEmbodimentId !== plan.leadEmbodimentId
            ? plan.anchorEmbodimentId
            : null
        : null;

  return dedupeEmbodimentIds([plan.leadEmbodimentId, secondary]);
}

export function buildOrganoidOrchestration(args: {
  event: CanonicalEvent;
  cls: ClassifierOutput;
  scores: ScoreBundle;
  thesis: ThesisBundle;
  mode: CanonicalMode;
  embodiments: EmbodimentProfile[];
  selectedEmbodimentId: string;
  state?: OrganoidRuntimeState;
}): OrganoidOrchestrationContract {
  const signal = decomposeOrganoidSignals({ event: args.event, cls: args.cls, scores: args.scores, thesis: args.thesis });
  const phase = inferOrganoidPhase({
    signal,
    scores: args.scores,
    thesis: args.thesis,
    mode: args.mode,
    state: args.state,
  });
  const resonance = scoreEmbodiments({
    embodiments: args.embodiments,
    signal,
    phase,
    cls: args.cls,
    scores: args.scores,
    thesis: args.thesis,
    mode: args.mode,
    state: args.state,
  });
  const roles = deriveRoles(resonance, args.state);
  const leadEmbodimentId =
    resonance.find((entry) => entry.embodimentId === args.selectedEmbodimentId && entry.score >= 0.45)?.embodimentId ??
    resonance[0]?.embodimentId ??
    args.selectedEmbodimentId;
  const thesisPlan = deriveThesisPlan({ phase, scores: args.scores, cls: args.cls, thesis: args.thesis, signal });
  const silencingPolicy = deriveSilencePolicy({ phase, scores: args.scores, thesis: thesisPlan, signal });
  const orchestrationMode = silencingPolicy === "silence" ? "silence" : deriveOrchestrationMode(thesisPlan, phase.phaseConfidence, resonance);
  const baseRoles = { ...roles, lead: leadEmbodimentId };
  const activeEmbodimentIds = dedupeEmbodimentIds([
    leadEmbodimentId,
    baseRoles.counterweight,
    baseRoles.anchor,
    baseRoles.echo,
  ]).slice(0, 3);
  const renderPolicy = deriveRenderPolicy({
    phase,
    roles: baseRoles,
    silencePolicy: silencingPolicy,
    activeEmbodimentIds,
  });
  const expression = deriveExpressionPlan({
    phase,
    roles: baseRoles,
    thesis: thesisPlan,
    scores: args.scores,
    silencePolicy: silencingPolicy,
    renderPolicy,
  });
  const blendEmbodimentIds = orchestrationMode === "blend" ? activeEmbodimentIds.slice(0, 3) : activeEmbodimentIds.slice(1, 3);
  const suppressedEmbodimentIds = dedupeEmbodimentIds([
    ...resonance.filter((entry) => entry.blockedBy.length > 0 || entry.components.antiDrift < 0.35 || entry.score < 0.25).map((entry) => entry.embodimentId),
    baseRoles.suppressor,
  ]).filter((id) => id !== leadEmbodimentId && id !== baseRoles.counterweight && id !== baseRoles.anchor);
  const echoEmbodimentIds = dedupeEmbodimentIds([
    baseRoles.echo,
    args.state?.shortTermMatrix?.lastLeadEmbodimentId,
    ...(args.state?.recentEmbodimentIds ?? []),
  ]).filter((id) => id !== leadEmbodimentId && id !== baseRoles.counterweight && id !== baseRoles.anchor).slice(0, 2);
  const plan: OrganoidOrchestrationContract = normalizeOrganoidContract({
    contractVersion: ORGANOID_CONTRACT_VERSION,
    signal,
    phase,
    resonance,
    orchestrationMode,
    roles: { ...baseRoles, lead: leadEmbodimentId, echo: echoEmbodimentIds[0] ?? baseRoles.echo, suppressor: suppressedEmbodimentIds[0] ?? baseRoles.suppressor },
    thesis: thesisPlan,
    expression,
    validation: { ok: true, reasons: [], warnings: [] },
    leadEmbodimentId,
    counterweightEmbodimentId: baseRoles.counterweight ?? leadEmbodimentId,
    anchorEmbodimentId: baseRoles.anchor ?? leadEmbodimentId,
    echoEmbodimentIds,
    suppressedEmbodimentIds,
    interventionType: thesisPlan.intervention,
    truthBoundary: thesisPlan.truthBoundary,
    silencePolicy: silencingPolicy,
    renderPolicy,
    dominantEmbodimentId: leadEmbodimentId,
    blendEmbodimentIds,
    activeEmbodimentIds: activeEmbodimentIds.length > 0 ? activeEmbodimentIds : [leadEmbodimentId],
    selectedEmbodimentId: args.selectedEmbodimentId,
  });
  plan.validation = validateCanonicalFit(plan, args.embodiments);
  return plan;
}

const CANONICAL_IDS = new Set([
  "stillhalter",
  "wurzelwaechter",
  "pilzarchitekt",
  "muenzhueter",
  "erzlauscher",
  "glutkern",
  "nebelspieler",
]);

export function validateCanonicalFit(plan: OrganoidOrchestrationPlan, embodiments: EmbodimentProfile[]): OrganoidValidationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const loaded = new Set(embodiments.map((profile) => profile.id));

  if (plan.contractVersion !== ORGANOID_CONTRACT_VERSION) reasons.push("contract_version_mismatch");
  if (!ORGANOID_PHASES.includes(plan.phase.activePhase)) reasons.push("unknown_phase");
  if (!CANONICAL_IDS.has(plan.leadEmbodimentId)) reasons.push("noncanonical_lead_embodiment");
  if (!loaded.has(plan.leadEmbodimentId)) reasons.push("missing_lead_embodiment");
  if (!["speak", "speak_brief", "caution_only", "stabilize_only", "silence"].includes(plan.silencePolicy)) reasons.push("invalid_silence_policy");
  if (!["lead_only", "lead_plus_anchor", "lead_plus_counterweight", "multi_internal_single_external", "suppress_external_multi"].includes(plan.renderPolicy)) reasons.push("invalid_render_policy");

  for (const id of plan.activeEmbodimentIds) {
    if (!CANONICAL_IDS.has(id)) warnings.push(`noncanonical_active:${id}`);
    if (!loaded.has(id)) warnings.push(`unloaded_active:${id}`);
  }

  if (plan.orchestrationMode === "silence" && plan.silencePolicy !== "silence" && plan.thesis.responseNecessity !== "should_silence") {
    warnings.push("silence_mode_without_silence_thesis");
  }

  return { ok: reasons.length === 0, reasons, warnings };
}

export function formatOrganoidPromptBlock(plan: OrganoidOrchestrationPlan): string[] {
  const active = plan.activeEmbodimentIds.join(" -> ");
  const blend = plan.blendEmbodimentIds.length > 0 ? plan.blendEmbodimentIds.join(", ") : "none";
  return [
    "Organoid matrix:",
    `contract version: ${plan.contractVersion}`,
    `phase: ${plan.phase.activePhase}`,
    `phase confidence: ${plan.phase.phaseConfidence.toFixed(2)}`,
    `transition pressure: ${plan.phase.transitionPressure.toFixed(2)}`,
    `orchestration mode: ${plan.orchestrationMode}`,
    `silence policy: ${plan.silencePolicy}`,
    `render policy: ${plan.renderPolicy}`,
    `active embodiments: ${active}`,
    `blend candidates: ${blend}`,
    `intervention: ${plan.thesis.intervention}`,
    `truth boundary: ${plan.thesis.truthBoundary}`,
    `response necessity: ${plan.thesis.responseNecessity}`,
    `expression posture: ${plan.expression.posture}`,
    `expression density: ${plan.expression.density}`,
    `expression length hint: ${plan.expression.lengthHint}`,
    `glyph prefix: ${plan.expression.glyphPrefix}`,
    `format directive: ${plan.expression.formatDirective}`,
    `lead: ${plan.leadEmbodimentId}`,
    `counterweight: ${plan.counterweightEmbodimentId}`,
    `anchor: ${plan.anchorEmbodimentId}`,
    plan.echoEmbodimentIds.length > 0 ? `echo: ${plan.echoEmbodimentIds.join(", ")}` : null,
    plan.suppressedEmbodimentIds.length > 0 ? `suppressed: ${plan.suppressedEmbodimentIds.join(", ")}` : null,
    plan.roles.suppressor ? `suppressor: ${plan.roles.suppressor}` : null,
  ].filter((value): value is string => Boolean(value));
}

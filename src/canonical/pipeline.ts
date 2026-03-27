import type { LLMClient } from "../clients/llmClient.js";
import { dedupeCheckAndMark } from "../ops/dedupeGuard.js";
import { enforceLaunchRateLimits } from "../ops/rateLimiter.js";
import type {
  CanonicalEvent,
  CanonicalConfig,
  PipelineResult,
  ClassifierOutput,
  ScoreBundle,
  SkipReason,
  IntentClass,
  CanonicalMode,
} from "./types.js";
import { DEFAULT_CANONICAL_CONFIG } from "./types.js";
import { classify } from "./classifier.js";
import { scoreEvent } from "./scorer.js";
import { checkEligibility } from "./eligibility.js";
import { extractThesis } from "./thesisExtractor.js";
import { selectMode } from "./modeSelector.js";
import { fallbackCascade } from "./fallbackCascade.js";
import { buildAuditRecord, persistAuditRecord } from "./auditLog.js";
import { addToAuditTail } from "./auditTail.js";
import { safetyFilter } from "../safety/safetyFilter.js";
import { mapNarrative } from "../narrative/narrativeMapper.js";
import { computeRelevanceScore } from "./relevanceScorer.js";
import { selectPattern } from "../roast/patternEngine.js";
import { formatDecision } from "../roast/formatDecision.js";
import { detectCARequest, detectOwnTokenSentiment } from "../intent/detectIntent.js";
import { buildCAResponse, buildOwnTokenSentimentResponse } from "./specialResponseBuilder.js";
import { getStateStore } from "../state/storeFactory.js";
import { calculateMarketEnergy, extractEnergySignals } from "../style/energyDetector.js";
import { computeKeywordDensity, isMemeCoinEvent } from "../style/degenRegardDetector.js";
import {
  estimateBissigkeitProxy,
  resolveStyle,
} from "../style/styleResolver.js";
import { getEmbodimentsConfig } from "../config/embodimentsConfig.js";
import { loadEmbodiments } from "../embodiments/loadEmbodiments.js";
import { getAllEmbodiments } from "../embodiments/registry.js";
import { deriveActivatedEmbodiments, renderEmbodimentGlyphs } from "../output/renderEmbodimentGlyphs.js";
import { getUserAffinityStore } from "../memory/userAffinityStore.js";
import { extractSelectorFeatures } from "../routing/selectorFeatures.js";
import { resolveContinuity } from "../routing/continuityResolver.js";
import { buildSemanticSelectionInputs } from "../embodiment/retrieval/runtimeSemantic.js";
import { selectEmbodiment, computeRuleBasedScores } from "../routing/embodimentSelector.js";
import type { EmbodimentSelectionResult } from "../routing/embodimentSelector.js";
import {
  buildOrganoidOrchestration,
  resolveRenderableEmbodimentIds,
  type OrganoidOrchestrationPlan,
  type OrganoidRenderPolicy,
  type OrganoidSilencePolicy,
} from "../organoid/orchestration.js";
import {
  buildOrganoidRuntimeState,
  captureOrganoidShortTermMatrix,
  loadOrganoidShortTermMatrix,
  saveOrganoidShortTermMatrix,
  type OrganoidShortTermMatrix,
} from "../organoid/state.js";
import { isConceptualProbe, isOrchestrationEligibleMinimal } from "./conceptualProbe.js";
import { normalizeCanonicalInputText } from "./inputNormalization.js";

export interface PipelineDeps {
  llm: LLMClient;
  botUserId: string;
}

const SOCIAL_INTENTS: IntentClass[] = [
  "greeting",
  "casual_ping",
  "question",
  "market_question_general",
  "embodiment_query",
  "lore_query",
  "conversation_continue",
];

function makeSkipResult(
  event: CanonicalEvent,
  skipReason: SkipReason,
  cls?: ClassifierOutput,
  scores?: ScoreBundle,
  config?: CanonicalConfig,
  inputNormalization?: ReturnType<typeof normalizeCanonicalInputText>,
): PipelineResult {
  const cfg = config ?? DEFAULT_CANONICAL_CONFIG;
  const clsOut = cls ?? emptyClassifier();
  const intentTrace = buildAuditIntentTrace(clsOut);
  const pathType = SOCIAL_INTENTS.includes(clsOut.intent) ? "social" as const : "audit" as const;
  const audit = buildAuditRecord({
    event,
    cls: clsOut,
    scores: scores ?? emptyScores(),
    mode: "ignore",
    ...buildAuditDebugFields({
      ...intentTrace,
      orchestrationEligibleMinimal: false,
      conceptualProbeRescue: false,
      fastPathBypassReason: undefined,
      finalMode: "ignore",
      leadEmbodimentId: undefined,
    }),
    inputNormalization,
      thesis: null,
      prompt_hash: null,
      model_id: cfg.model_id,
    validation: null,
    final_action: "skip",
    skip_reason: skipReason,
    reply_text: null,
    path: pathType,
  });
  persistAuditRecord(audit);
  return { action: "skip", skip_reason: skipReason, audit };
}

function isValidEvent(event: CanonicalEvent): boolean {
  if (!event.event_id || !event.text || !event.text.trim()) return false;
  if (!event.author_id || !event.author_handle) return false;
  return true;
}

function isSelfLoop(event: CanonicalEvent, botUserId: string): boolean {
  return event.author_id === botUserId;
}

function deriveFastPathBypassReason(args: {
  event: CanonicalEvent;
  conceptualProbeCandidate: boolean;
}): string {
  if (args.conceptualProbeCandidate && detectOwnTokenSentiment(args.event.text)) {
    return "conceptual_probe_preempts_own_token_sentiment";
  }
  return "no_fast_path_match";
}

function buildAuditDebugFields(args: {
  classifierIntent: IntentClass;
  baseIntent: IntentClass;
  sourceIntent: IntentClass;
  hasParentContext?: boolean;
  continuationSignal?: boolean;
  continuationSupportScore?: number;
  structuredCritiqueSignal?: boolean;
  structuredCritiqueSupportScore?: number;
  orchestrationEligibleMinimal: boolean;
  conceptualProbeRescue?: boolean;
  fastPathBypassReason?: string;
  finalMode: CanonicalMode;
  leadEmbodimentId?: string;
  organoidPlan?: OrganoidOrchestrationPlan;
}): {
  classifierIntent: IntentClass;
  baseIntent: IntentClass;
  sourceIntent: IntentClass;
  hasParentContext?: boolean;
  continuationSignal?: boolean;
  continuationSupportScore?: number;
  structuredCritiqueSignal?: boolean;
  structuredCritiqueSupportScore?: number;
  orchestrationEligibleMinimal: boolean;
  conceptualProbeRescue?: boolean;
  fastPathBypassReason?: string;
  finalMode: CanonicalMode;
  silencePolicy?: OrganoidSilencePolicy;
  renderPolicy?: OrganoidRenderPolicy;
  leadEmbodimentId?: string;
} {
  return {
    classifierIntent: args.classifierIntent,
    baseIntent: args.baseIntent,
    sourceIntent: args.sourceIntent,
    hasParentContext: args.hasParentContext,
    continuationSignal: args.continuationSignal,
    continuationSupportScore: args.continuationSupportScore,
    structuredCritiqueSignal: args.structuredCritiqueSignal,
    structuredCritiqueSupportScore: args.structuredCritiqueSupportScore,
    orchestrationEligibleMinimal: args.orchestrationEligibleMinimal,
    conceptualProbeRescue: args.conceptualProbeRescue,
    fastPathBypassReason: args.fastPathBypassReason,
    finalMode: args.finalMode,
    silencePolicy: args.organoidPlan?.silencePolicy,
    renderPolicy: args.organoidPlan?.renderPolicy,
    leadEmbodimentId: args.leadEmbodimentId ?? args.organoidPlan?.leadEmbodimentId,
  };
}

function buildAuditIntentTrace(cls: ClassifierOutput): {
  classifierIntent: IntentClass;
  baseIntent: IntentClass;
  sourceIntent: IntentClass;
  hasParentContext?: boolean;
  continuationSignal?: boolean;
  continuationSupportScore?: number;
  structuredCritiqueSignal?: boolean;
  structuredCritiqueSupportScore?: number;
} {
  return {
    classifierIntent: cls.intent,
    baseIntent: cls.baseIntent ?? cls.intent,
    sourceIntent: cls.intent,
    hasParentContext: cls.hasParentContext,
    continuationSignal: cls.continuationSignal,
    continuationSupportScore: cls.continuationSupportScore,
    structuredCritiqueSignal: cls.structuredCritiqueSignal,
    structuredCritiqueSupportScore: cls.structuredCritiqueSupportScore,
  };
}

export async function handleEvent(
  event: CanonicalEvent,
  deps: PipelineDeps,
  config: CanonicalConfig = DEFAULT_CANONICAL_CONFIG,
): Promise<PipelineResult> {
  if (!isValidEvent(event)) {
    return makeSkipResult(event, "skip_invalid_input", undefined, undefined, config);
  }

  const inputNormalization = normalizeCanonicalInputText(event.text);
  const conceptualProbeCandidate = isConceptualProbe(event.text, { event });

  const dedupe = await dedupeCheckAndMark(event.event_id);
  if (!dedupe.ok) {
    return makeSkipResult(event, "skip_duplicate", undefined, undefined, config, inputNormalization);
  }

  const rateLimit = await enforceLaunchRateLimits({
    authorHandle: event.author_handle,
    globalId: "canonical_global",
  });
  if (!rateLimit.ok) {
    return makeSkipResult(event, "skip_rate_limit", undefined, undefined, config, inputNormalization);
  }

  if (isSelfLoop(event, deps.botUserId)) {
    return makeSkipResult(event, "skip_self_loop", undefined, undefined, config, inputNormalization);
  }

  const safetyResult = safetyFilter(event);
  if (!safetyResult.passed) {
    const cls = classify(event);
    return makeSkipResult(event, "skip_safety_filter", cls, undefined, config, inputNormalization);
  }

  // ── Special intent fast-path: CA request ────────────────────────────────
  // In aggressive mode: CA safety still applies (address gate always enforced)
  // but we skip the fast-path so the full roast pipeline runs instead.
  if (detectCARequest(event.text) && !config.aggressive_mode) {
    const replyText = buildCAResponse(event.text, event.event_id);
    const cls = classify(event);
    const scores = scoreEvent(event, cls);
    const audit = buildAuditRecord({
      event,
      cls,
      scores,
      mode: "neutral_clarification",
      ...buildAuditDebugFields({
        ...buildAuditIntentTrace(cls),
        orchestrationEligibleMinimal: false,
        conceptualProbeRescue: false,
        fastPathBypassReason: undefined,
        finalMode: "neutral_clarification",
        leadEmbodimentId: undefined,
      }),
      inputNormalization,
      thesis: null,
      prompt_hash: null,
      model_id: config.model_id,
      validation: null,
      final_action: "publish",
      skip_reason: null,
      reply_text: replyText,
      path: "social",
      detected_narrative: "ca_request",
      selected_pattern: undefined,
      response_mode: "single_tweet",
    });
    persistAuditRecord(audit);
    addToAuditTail(audit).catch(() => {});
    return {
      action: "publish",
      mode: "neutral_clarification",
      thesis: { primary: "social_engagement", supporting_point: null, evidence_bullets: [] },
      reply_text: replyText,
      audit,
    };
  }

  // ── Special intent fast-path: Own token sentiment ────────────────────────
  // In aggressive mode: skip fast-path so the full roast pipeline runs instead.
  if (detectOwnTokenSentiment(event.text) && !config.aggressive_mode && !conceptualProbeCandidate) {
    const replyText = buildOwnTokenSentimentResponse(
      { marketSentiment: "neutral" },
      event.event_id,
    );
    const cls = classify(event);
    const scores = scoreEvent(event, cls);
    const audit = buildAuditRecord({
      event,
      cls,
      scores,
      mode: "market_banter",
      ...buildAuditDebugFields({
        ...buildAuditIntentTrace(cls),
        orchestrationEligibleMinimal: false,
        conceptualProbeRescue: false,
        fastPathBypassReason: undefined,
        finalMode: "market_banter",
        leadEmbodimentId: undefined,
      }),
      inputNormalization,
      thesis: null,
      prompt_hash: null,
      model_id: config.model_id,
      validation: null,
      final_action: "publish",
      skip_reason: null,
      reply_text: replyText,
      path: "social",
      detected_narrative: "own_token_sentiment",
      selected_pattern: undefined,
      response_mode: "single_tweet",
    });
    persistAuditRecord(audit);
    addToAuditTail(audit).catch(() => {});
    return {
      action: "publish",
      mode: "market_banter",
      thesis: { primary: "social_engagement", supporting_point: null, evidence_bullets: [] },
      reply_text: replyText,
      audit,
    };
  }

  const cls = classify(event);
  const classifierIntent = cls.intent;
  const sourceIntent = cls.intent;
  const isConceptualProbeRescue =
    classifierIntent === "conceptual_probe" ||
    conceptualProbeCandidate;

  if (cls.policy_severity === "hard" || (cls.policy_blocked && !cls.policy_severity)) {
    return makeSkipResult(event, "skip_policy", cls, undefined, config, inputNormalization);
  }

  const scores = scoreEvent(event, cls);
  const minimalOrchestrationEligible = isOrchestrationEligibleMinimal({
    event,
    cls,
    scores,
  });
  const fastPathBypassReason = deriveFastPathBypassReason({
    event,
    conceptualProbeCandidate,
  });

  const eligibility = checkEligibility(scores, cls, config);
  if (!eligibility.eligible && !minimalOrchestrationEligible) {
    return makeSkipResult(event, eligibility.skip_reason!, cls, scores, config, inputNormalization);
  }

  const thesis = extractThesis(event, cls, scores);
  if (!thesis) {
    return makeSkipResult(event, "skip_no_thesis", cls, scores, config, inputNormalization);
  }

  let mode = selectMode(cls, scores, thesis, config, { text: event.text });
  if (mode === "ignore" && minimalOrchestrationEligible) {
    mode = "neutral_clarification";
  }
  if (classifierIntent === "conceptual_probe") {
    mode = "neutral_clarification";
  }
  if (mode === "ignore" && config.test_mode) {
    mode = "soft_deflection";
  }
  if (mode === "ignore") {
    return makeSkipResult(event, "skip_low_confidence", cls, scores, config, inputNormalization);
  }

  const narrative = mapNarrative(event, cls);
  const relevanceResult = computeRelevanceScore({
    event,
    cls,
    scores,
    thesis,
    narrative: narrative ?? null,
  });

  // Calculate market energy and resolve style (relevance for hybrid bissigkeit)
  const energySignals = extractEnergySignals(event, cls, scores);
  const energyLevel = calculateMarketEnergy(energySignals);
  const bissigkeit =
    event.bissigkeit_score ??
    estimateBissigkeitProxy(
      scores,
      thesis,
      relevanceResult.score ?? scores.relevance,
    );
  const keyword_density = computeKeywordDensity(event);
  const is_meme_coin_event = isMemeCoinEvent(event, cls, energySignals);
  const styleContext = resolveStyle(mode, energyLevel, bissigkeit, {
    relevance_score: relevanceResult.score ?? scores.relevance,
    keyword_density,
    is_meme_coin_event,
  });

  const pattern = selectPattern(
    thesis,
    narrative ?? { label: "unclassified", confidence: 0.5, sentiment: "neutral" },
    scores,
    event.author_id,
  );
  const minRelevance = config.thresholds.social && cls.intent && SOCIAL_INTENTS.includes(cls.intent)
    ? (config.thresholds.social.min_relevance ?? config.thresholds.min_relevance)
    : config.thresholds.min_relevance;
  const effectiveMinRelevance = config.test_mode ? 0 : minRelevance;
  const format = formatDecision({
    event,
    cls,
    narrative,
    relevanceScore: scores.relevance,
    minRelevanceThreshold: minimalOrchestrationEligible ? 0 : effectiveMinRelevance,
    threadEnabled: (config as { thread_enabled?: boolean }).thread_enabled ?? false,
  });

  if (format.format === "skip") {
    return makeSkipResult(event, "skip_format_decision", cls, scores, config, inputNormalization);
  }

  const store = getStateStore();
  let embodimentSelection: EmbodimentSelectionResult | undefined;
  let organoidPlan: OrganoidOrchestrationPlan | undefined;
  let organoidShortTermMatrix: OrganoidShortTermMatrix | null = null;
  const persistOrganoidMatrix = async (validationOk: boolean): Promise<void> => {
    if (!embodimentsCfg.EMBODIMENT_ORCHESTRATION_ENABLED || !organoidPlan) return;
    const nextMatrix = captureOrganoidShortTermMatrix(organoidPlan, organoidShortTermMatrix);
    organoidShortTermMatrix = await saveOrganoidShortTermMatrix(nextMatrix, store);
    if (!validationOk && embodimentsCfg.EMBODIMENT_ROUTING_DEBUG) {
      console.warn("[ORGANOID] Persisted matrix after non-validating run", {
        phase: organoidPlan.phase.activePhase,
        leadEmbodimentId: organoidPlan.leadEmbodimentId,
      });
    }
  };
  const embodimentsCfg = getEmbodimentsConfig();
  if (embodimentsCfg.EMBODIMENTS_ENABLED) {
    try {
      await loadEmbodiments();
      const affinityStore = getUserAffinityStore();
      const embodiments = getAllEmbodiments();
      const userAffinityByEmbodiment: Record<string, number> = {};
      for (const g of embodiments) {
        const a = await affinityStore.getAffinity(event.author_id, g.id);
        userAffinityByEmbodiment[g.id] = a?.familiarity ?? 0;
      }
      const features = extractSelectorFeatures(cls, scores, event, {
        marketEnergy: styleContext?.energyLevel ?? "MEDIUM",
      });
      const ruleBasedScores = computeRuleBasedScores(features, userAffinityByEmbodiment, mode);
      const semanticInputs = await buildSemanticSelectionInputs({
        embodiments: embodiments,
        features,
        ruleBasedScores,
      });
      const selection = selectEmbodiment(features, mode, {
        defaultSafeEmbodiment: embodimentsCfg.DEFAULT_SAFE_EMBODIMENT,
        enabled: true,
        userAffinityByEmbodiment,
        semanticFitByEmbodiment: semanticInputs.semanticFitByEmbodiment,
        continuityBonusByEmbodiment: semanticInputs.continuityBonusByEmbodiment,
        semanticExplainByEmbodiment: semanticInputs.semanticExplainByEmbodiment,
        swarmEnabled: embodimentsCfg.EMBODIMENT_SWARM_ENABLED,
        maxCameos: embodimentsCfg.EMBODIMENT_SWARM_ENABLED ? 2 : 0,
      });
      const continuity = resolveContinuity(
        selection.selectedEmbodimentId,
        { threadId: event.event_id },
        { continuityEnabled: embodimentsCfg.EMBODIMENT_CONTINUITY_ENABLED },
      );
      embodimentSelection = {
        ...selection,
        selectedEmbodimentId: continuity.embodimentId,
      };
      if (embodimentsCfg.EMBODIMENT_ORCHESTRATION_ENABLED) {
        organoidShortTermMatrix = await loadOrganoidShortTermMatrix(store);
        const state = buildOrganoidRuntimeState(organoidShortTermMatrix, {
          recentPhases: organoidShortTermMatrix.lastPhase ? [organoidShortTermMatrix.lastPhase] : [],
          recentEmbodimentIds: [continuity.embodimentId],
          driftPressure: Math.max(scores.risk, organoidShortTermMatrix.driftSignal),
          coherence: scores.confidence,
        });
        const plan = buildOrganoidOrchestration({
          event,
          cls,
          scores,
          thesis,
          mode,
          embodiments,
          selectedEmbodimentId: continuity.embodimentId,
          state,
        });
        organoidPlan = plan;
        embodimentSelection.selectedEmbodimentId = plan.leadEmbodimentId;
        if (!plan.validation.ok || plan.validation.warnings.length > 0) {
          console.warn("[ORGANOID] Orchestration validation state", {
            ok: plan.validation.ok,
            reasons: plan.validation.reasons,
            warnings: plan.validation.warnings,
          });
        }
        if (plan.silencePolicy === "silence") {
          await persistOrganoidMatrix(plan.validation.ok);
          return makeSkipResult(event, "skip_orchestration_silence", cls, scores, config, inputNormalization);
        }
      }
    } catch {
      // Keep embodimentSelection undefined; fallbackCascade will select internally
    }
  }

  const promptContext = {
    pattern_id: pattern.pattern_id,
    narrative_label: narrative?.label ?? undefined,
    format_target: format.format,
    orchestrationEligibility: minimalOrchestrationEligible
      ? ("orchestration_eligible_minimal" as const)
      : ("standard" as const),
    orchestrationReason: minimalOrchestrationEligible ? "conceptual_probe_rescue" : undefined,
    style: styleContext,
    relevanceResult,
    estimatedBissigkeit: bissigkeit,
    embodimentSelection,
    organoid: organoidPlan,
  };

  const result = await fallbackCascade(
    deps.llm,
    event,
    mode,
    thesis,
    scores,
    cls,
    config,
    promptContext,
  );

  const finalMode = (classifierIntent === "conceptual_probe" || isConceptualProbeRescue)
    ? ("neutral_clarification" as const)
    : result.final_mode;

  if (!result.success || !result.reply_text) {
    await persistOrganoidMatrix(Boolean(result.validation?.ok));
    const pathType = SOCIAL_INTENTS.includes(sourceIntent) ? "social" as const : "audit" as const;
    const audit = buildAuditRecord({
      event,
      cls,
      scores,
      mode: finalMode,
      ...buildAuditDebugFields({
        classifierIntent,
        baseIntent: cls.baseIntent ?? classifierIntent,
        sourceIntent,
        hasParentContext: cls.hasParentContext,
        continuationSignal: cls.continuationSignal,
        continuationSupportScore: cls.continuationSupportScore,
        structuredCritiqueSignal: cls.structuredCritiqueSignal,
        structuredCritiqueSupportScore: cls.structuredCritiqueSupportScore,
        orchestrationEligibleMinimal: minimalOrchestrationEligible,
        conceptualProbeRescue: isConceptualProbeRescue,
        fastPathBypassReason,
        finalMode,
        leadEmbodimentId: organoidPlan?.leadEmbodimentId ?? embodimentSelection?.selectedEmbodimentId,
        organoidPlan,
      }),
      inputNormalization,
      thesis,
      prompt_hash: result.prompt_hash,
      model_id: result.model_id,
      validation: result.validation,
      final_action: "skip",
      skip_reason: "skip_validation_failure",
      reply_text: null,
      path: pathType,
      detected_narrative: narrative?.label,
      selected_pattern: pattern.pattern_id,
      response_mode: format.format,
    });
    persistAuditRecord(audit);
    return { action: "skip", skip_reason: "skip_validation_failure", audit };
  }
  const finalEmbodimentId =
    organoidPlan?.leadEmbodimentId ??
    embodimentSelection?.selectedEmbodimentId ??
    result.selectedEmbodimentId ??
    embodimentsCfg.DEFAULT_SAFE_EMBODIMENT;
  const renderEmbodimentIds = organoidPlan ? resolveRenderableEmbodimentIds(organoidPlan) : undefined;
  const activatedEmbodiments = deriveActivatedEmbodiments(
    finalEmbodimentId,
    embodimentSelection?.cameoCandidates,
    renderEmbodimentIds,
  );
  const finalizedReply = renderEmbodimentGlyphs(result.reply_text, activatedEmbodiments);
  if (!finalizedReply) {
    return makeSkipResult(event, "skip_validation_failure", cls, scores, config, inputNormalization);
  }

  const pathType = SOCIAL_INTENTS.includes(sourceIntent) ? "social" as const : "audit" as const;
    const audit = buildAuditRecord({
      event,
      cls,
      scores,
      mode: finalMode,
      ...buildAuditDebugFields({
        classifierIntent,
        baseIntent: cls.baseIntent ?? classifierIntent,
        sourceIntent,
        hasParentContext: cls.hasParentContext,
        continuationSignal: cls.continuationSignal,
        continuationSupportScore: cls.continuationSupportScore,
        structuredCritiqueSignal: cls.structuredCritiqueSignal,
        structuredCritiqueSupportScore: cls.structuredCritiqueSupportScore,
        orchestrationEligibleMinimal: minimalOrchestrationEligible,
        conceptualProbeRescue: isConceptualProbeRescue,
        fastPathBypassReason,
        finalMode,
        leadEmbodimentId: finalEmbodimentId,
        organoidPlan,
      }),
      inputNormalization,
      thesis,
      prompt_hash: result.prompt_hash,
    model_id: result.model_id,
    validation: result.validation,
    final_action: "publish",
    skip_reason: null,
    reply_text: finalizedReply,
    path: pathType,
    detected_narrative: narrative?.label,
    selected_pattern: pattern.pattern_id,
    response_mode: format.format,
    energy_level: energyLevel,
    slang_applied: styleContext.slangEnabled,
    bissigkeit_score: result.finalBissigkeit,
  });
  persistAuditRecord(audit);
  addToAuditTail(audit).catch(() => {});

  await persistOrganoidMatrix(Boolean(result.validation?.ok));

  try {
    await store.set(`event:${event.event_id}:seen`, "1", 86400);
    await store.set(`event:${event.event_id}:processed`, "1", 86400);
  } catch {
    // KV state tracking is best-effort; never block publish
  }

  return {
    action: "publish",
    mode: finalMode,
    thesis,
    reply_text: finalizedReply,
    audit,
    selectedEmbodimentId: finalEmbodimentId,
    intent: cls.intent,
    embodimentSelection,
  };
}

function emptyClassifier(): ClassifierOutput {
  return {
    intent: "irrelevant",
    target: "none",
    evidence_class: "absent",
    bait_probability: 0,
    spam_probability: 0,
    policy_blocked: false,
    evidence_bullets: [],
    risk_flags: [],
  };
}

function emptyScores(): ScoreBundle {
  return { relevance: 0, confidence: 0, severity: 0, opportunity: 0, risk: 0, novelty: 0 };
}

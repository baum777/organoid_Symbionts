import { createUnifiedLLMClient } from "../clients/llmClient.unified.js";
import { createXClient } from "../clients/xClient.js";
import { invokeXApiRequest } from "../clients/xApi.js";
import { handleEvent, type PipelineDeps } from "../canonical/pipeline.js";
import { DEFAULT_CANONICAL_CONFIG, type CanonicalEvent } from "../canonical/types.js";
import { readTimelineEngagementConfig } from "../config/timelineEngagementConfig.js";
import { readEngagementComplianceConfig } from "../config/engagementComplianceConfig.js";
import { EngagementMemory } from "../engagement/engagementMemory.js";
import { normalizeTimelineCandidate } from "../engagement/normalizeTimelineCandidate.js";
import { rankTimelineCandidates, selectTopTimelineCandidates } from "../engagement/rankTimelineCandidates.js";
import { scoutTimelineCandidates } from "../engagement/timelineScout.js";
import type { TimelineCandidate } from "../engagement/types.js";
import { logInfo, logWarn } from "../ops/logger.js";
import { isPostingDisabled } from "../ops/launchGate.js";
import { withCircuitBreaker } from "../ops/llmCircuitBreaker.js";
import { evaluateProactiveEngagementPolicy } from "../policy/proactiveEngagementPolicy.js";
import { evaluateConsent, type ConsentInput } from "../engagement/consentEvaluator.js";
import { evaluateEnergy, type EnergyInput } from "../engagement/energyEvaluator.js";
import { decideEngagement } from "../engagement/engagementDecision.js";
import {
  recordConsentDecision,
  recordEngagementDecision,
} from "../engagement/complianceMetrics.js";
import {
  buildInteractionKey,
  isInteractionHandled,
  isInteractionReserved,
} from "../engagement/interactionLedger.js";
import {
  runWritePreflight,
  releaseWritePreflight,
  markWriteHandled,
} from "../engagement/writePreflight.js";
import { publishWithRetry } from "../state/eventStateStore.js";
import { checkLLMBudget } from "../state/sharedBudgetGate.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getUserId(): Promise<string> {
  const user = await invokeXApiRequest<{ data: { id: string } }>({
    method: "GET",
    uri: "https://api.x.com/2/users/me",
  });
  return user.data.id;
}

function toCanonicalEvent(candidate: TimelineCandidate): CanonicalEvent {
  return {
    event_id: `timeline:${candidate.tweetId}`,
    platform: "twitter",
    trigger_type: "reply",
    author_handle: `@${candidate.authorUsername}`,
    author_id: candidate.authorId,
    text: candidate.text,
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: (candidate.text.match(/\$[A-Z]{2,10}/gi) ?? []).map((s) => s.toUpperCase()),
    hashtags: candidate.text.match(/#\w+/g) ?? [],
    urls: candidate.text.match(/https?:\/\/\S+/gi) ?? [],
    timestamp: candidate.createdAt,
  };
}

function normalizeHandle(handle: string | null | undefined): string {
  return (handle ?? "").toLowerCase().replace(/^@/, "").trim();
}

function buildTimelineConsentInput(params: {
  candidate: TimelineCandidate;
  optInHandles: string[];
  optOutHandles: string[];
  priorInteraction: boolean;
}): ConsentInput {
  const authorHandle = normalizeHandle(params.candidate.authorUsername);
  const hasExplicitOptIn = authorHandle ? params.optInHandles.includes(authorHandle) : false;
  const hasOptOut = authorHandle ? params.optOutHandles.includes(authorHandle) : false;

  return {
    isDirectMention: false,
    isReplyToBot: false,
    isQuoteOfBot: false,
    hasExplicitOptIn,
    hasOptOut,
    priorInteraction: params.priorInteraction,
    isSearchDerived: true,
  };
}

function buildTimelineEnergyInput(candidate: TimelineCandidate): EnergyInput {
  const text = candidate.text ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  const questionLike = text.includes("?") || /\b(why|how|what|when|where|should|could|would)\b/i.test(text);

  const directness = candidate.isReply ? 4 : candidate.isThreadRoot ? 3 : 1;
  const intent = questionLike ? 4 : words.length > 16 ? 3 : 1;
  const relevance = Math.min(4, Math.max(0, candidate.finalScore / 25));

  const createdAtMs = Date.parse(candidate.createdAt);
  const ageHours = Number.isFinite(createdAtMs) ? Math.max(0, (Date.now() - createdAtMs) / 3_600_000) : 48;
  const freshness = ageHours < 1 ? 4 : ageHours < 6 ? 3 : ageHours < 24 ? 2 : ageHours < 72 ? 1 : 0;
  const legitimacy = candidate.conversationId ? 3 : 1;
  const friction = Math.min(
    4,
    Math.max(0, (candidate.spamRiskScore + candidate.policyRiskScore + candidate.repetitionRiskScore) / 30)
  );

  return { directness, intent, relevance, freshness, legitimacy, friction };
}

function logComplianceDecision(params: {
  tweetId: string;
  consentState: string;
  consentReason: string;
  energyBand: string;
  decision: string;
  reason: string;
}): void {
  logInfo("[COMPLIANCE] Timeline decision", params);
}

export async function runTimelineEngagementIteration(): Promise<void> {
  const config = readTimelineEngagementConfig();
  if (!config.enabled) {
    logInfo("[TIMELINE] Engagement disabled");
    return;
  }

  const dryRun = process.env.LAUNCH_MODE ? isPostingDisabled() : process.env.DRY_RUN === "true";
  const xClient = createXClient(dryRun);
  const llm = withCircuitBreaker(createUnifiedLLMClient());
  const botUserId = await getUserId();
  const deps: PipelineDeps = { llm, botUserId };
  const memory = new EngagementMemory();
  const compliance = readEngagementComplianceConfig();

  const scout = await scoutTimelineCandidates({
    sourceAccounts: config.sourceAccounts,
    keywordFilters: config.keywordFilters,
  });

  const normalized = scout.tweets.map((tweet) =>
    normalizeTimelineCandidate(
      tweet,
      scout.userMap.get(tweet.author_id) ?? tweet.author_id,
      scout.userMap.get(tweet.author_id) ?? "unknown"
    )
  );

  const ranked = rankTimelineCandidates(normalized);
  logInfo("[TIMELINE] Scout + rank completed", {
    scouted: scout.tweets.length,
    ranked: ranked.length,
    topIds: ranked.slice(0, 5).map((c) => ({ id: c.tweetId, score: c.finalScore })),
  });

  const policyAllowed: Array<TimelineCandidate & { interactionKey?: string }> = [];
  for (const candidate of ranked) {
    const interactionKey = buildInteractionKey({
      source: "timeline",
      tweetId: candidate.tweetId,
      authorId: candidate.authorId,
      conversationId: candidate.conversationId,
    });
    const priorInteraction =
      (await isInteractionHandled(interactionKey)) || (await isInteractionReserved(interactionKey));
    const consent = evaluateConsent(
      buildTimelineConsentInput({
        candidate,
        optInHandles: compliance.optInHandles,
        optOutHandles: compliance.optOutHandles,
        priorInteraction,
      })
    );
    const energy = evaluateEnergy(buildTimelineEnergyInput(candidate));
    const budgetCheck = await checkLLMBudget(false);
    const decision = decideEngagement({
      consent,
      energy,
      alreadyReplied: priorInteraction,
      hasWriteBudget: budgetCheck.allowed,
      authValid: Boolean(botUserId),
      aiApproval: compliance.aiApproval,
    });

    recordConsentDecision(consent);
    recordEngagementDecision(decision, consent, energy);
    logComplianceDecision({
      tweetId: candidate.tweetId,
      consentState: consent.state,
      consentReason: consent.reason,
      energyBand: energy.band,
      decision: decision.decision,
      reason: decision.reason,
    });

    if (decision.decision !== "ENGAGE") {
      logInfo("[TIMELINE] Candidate rejected by compliance", {
        tweetId: candidate.tweetId,
        decision: decision.decision,
        reason: decision.reason,
        consent: consent.state,
        energy: energy.band,
      });
      continue;
    }

    const preflight = await runWritePreflight({
      source: "timeline",
      tweetId: candidate.tweetId,
      authorId: candidate.authorId,
      conversationId: candidate.conversationId,
      verifyTarget: true,
    });

    if (!preflight.ok) {
      logInfo("[TIMELINE] Candidate rejected by preflight", {
        tweetId: candidate.tweetId,
        decision: preflight.reason,
      });
      continue;
    }

    const policyDecision = await evaluateProactiveEngagementPolicy(candidate, config, memory);
    if (!policyDecision.allowed) {
      logInfo("[TIMELINE] Candidate rejected by policy", {
        tweetId: candidate.tweetId,
        reason: policyDecision.reason,
        breakdown: candidate.scoreBreakdown,
      });
      await releaseWritePreflight(preflight.interactionKey);
      continue;
    }

    candidate.selectedBecause.push("compliance_gate_allow");
    candidate.selectedBecause.push(`energy_${energy.band.toLowerCase()}`);
    candidate.selectedBecause.push(`consent_${consent.state.toLowerCase()}`);
    candidate.selectedBecause.push(`decision_${decision.decision.toLowerCase()}`);
    candidate.selectedBecause.push("policy_gate_allow");
    candidate.selectedBecause.push("preflight_ok");
    policyAllowed.push({ ...candidate, interactionKey: preflight.interactionKey });
  }

  const selection = selectTopTimelineCandidates(policyAllowed, config.maxPerRun);

  let publishedCount = 0;
  for (const candidate of selection.selected as Array<TimelineCandidate & { interactionKey?: string }>) {
    const interactionKey = candidate.interactionKey;

    try {
      const event = toCanonicalEvent(candidate);
      const result = await handleEvent(event, deps, {
        ...DEFAULT_CANONICAL_CONFIG,
        model_id: DEFAULT_CANONICAL_CONFIG.model_id,
      });

      if (result.action !== "publish" || !result.reply_text) {
        logWarn("[TIMELINE] Candidate skipped by generation pipeline", {
          tweetId: candidate.tweetId,
          skipReason: result.action === "skip" ? result.skip_reason : "missing_reply_text",
        });
        if (interactionKey) {
          await releaseWritePreflight(interactionKey);
        }
        continue;
      }

      const publishResult = await publishWithRetry(event.event_id, async () => {
        const reply = await xClient.reply(result.reply_text, candidate.tweetId);
        return { tweetId: reply.id };
      });

      if (!publishResult.success || !publishResult.tweetId) {
        logWarn("[TIMELINE] Publish failed", { tweetId: candidate.tweetId, error: publishResult.error });
        if (interactionKey) {
          await releaseWritePreflight(interactionKey);
        }
        continue;
      }

      await memory.recordPublish({
        tweetId: candidate.tweetId,
        conversationId: candidate.conversationId,
        authorId: candidate.authorId,
        authorCooldownMinutes: config.authorCooldownMinutes,
        conversationCooldownMinutes: config.conversationCooldownMinutes,
      });

      if (interactionKey) {
        await markWriteHandled(interactionKey);
      }

      publishedCount += 1;
      logInfo("[TIMELINE] Published proactive reply", {
        tweetId: candidate.tweetId,
        replyId: publishResult.tweetId,
        selectedBecause: candidate.selectedBecause,
        breakdown: candidate.scoreBreakdown,
      });
    } catch (error) {
      if (interactionKey) {
        await releaseWritePreflight(interactionKey);
      }
      logWarn("[TIMELINE] Candidate failed during processing", {
        tweetId: candidate.tweetId,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
  }

  logInfo("[TIMELINE] Iteration complete", {
    scouted: scout.tweets.length,
    policyAllowed: policyAllowed.length,
    selected: selection.selected.length,
    publishedCount,
  });
}

export async function runTimelineEngagementLoop(): Promise<void> {
  const config = readTimelineEngagementConfig();
  logInfo("[TIMELINE] Worker starting", {
    enabled: config.enabled,
    intervalMs: config.intervalMs,
    maxPerRun: config.maxPerRun,
  });

  while (true) {
    try {
      await runTimelineEngagementIteration();
    } catch (error) {
      logWarn("[TIMELINE] Iteration failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(config.intervalMs);
  }
}

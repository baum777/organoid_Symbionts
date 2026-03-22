import { createUnifiedLLMClient } from "../clients/llmClient.unified.js";
import { createXClient } from "../clients/xClient.js";
import { invokeXApiRequest } from "../clients/xApi.js";
import { handleEvent, type PipelineDeps } from "../canonical/pipeline.js";
import { DEFAULT_CANONICAL_CONFIG } from "../canonical/types.js";
import { readTimelineEngagementConfig } from "../config/timelineEngagementConfig.js";
import { readEngagementComplianceConfig } from "../config/engagementComplianceConfig.js";
import { EngagementMemory } from "../engagement/engagementMemory.js";
import { normalizeTimelineCandidate } from "../engagement/normalizeTimelineCandidate.js";
import { rankTimelineCandidates, selectTopTimelineCandidates } from "../engagement/rankTimelineCandidates.js";
import { scoutTimelineCandidates } from "../engagement/timelineScout.js";
import type { TimelineCandidate } from "../engagement/types.js";
import {
  buildEngagementCandidate,
  buildRawTriggerInputFromTimelineCandidate,
  maybeBuildConversationBundle,
  toCanonicalExecutionInput,
} from "../engagement/candidateBoundary.js";
import { logInfo, logWarn } from "../ops/logger.js";
import { isPostingDisabled } from "../ops/launchGate.js";
import { withCircuitBreaker } from "../ops/llmCircuitBreaker.js";
import { getHolderId, POLL_LOCK_RETRY_MS, releasePollLock, tryAcquirePollLock } from "../ops/pollLock.js";
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
import { checkLLMBudget, reserveLLMBudget } from "../state/sharedBudgetGate.js";
import { recordPollSuccess } from "../observability/health.js";
import { incrementCounter, getGauge, setGauge } from "../observability/metrics.js";
import { COUNTER_NAMES, GAUGE_NAMES } from "../observability/metricTypes.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TimelineIterationStatus = "completed" | "denied" | "unavailable" | "disabled";

function bumpGauge(name: (typeof GAUGE_NAMES)[keyof typeof GAUGE_NAMES]): void {
  setGauge(name, getGauge(name) + 1);
}

function resetGauge(name: (typeof GAUGE_NAMES)[keyof typeof GAUGE_NAMES]): void {
  setGauge(name, 0);
}

function markLockAcquired(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_LOCK_ACQUIRED_TOTAL);
  resetGauge(GAUGE_NAMES.TIMELINE_LOCK_FAILURE_STREAK);
}

function markLockDenied(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_LOCK_DENIED_TOTAL);
  bumpGauge(GAUGE_NAMES.TIMELINE_LOCK_FAILURE_STREAK);
}

function markLockError(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_LOCK_ERROR_TOTAL);
  bumpGauge(GAUGE_NAMES.TIMELINE_LOCK_FAILURE_STREAK);
}

function markReservationAttempt(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_RESERVATION_ATTEMPT_TOTAL);
}

function markReservationSuccess(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_RESERVATION_SUCCEEDED_TOTAL);
  resetGauge(GAUGE_NAMES.TIMELINE_RESERVATION_FAILURE_STREAK);
}

function markReservationFailure(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_RESERVATION_FAILED_TOTAL);
  bumpGauge(GAUGE_NAMES.TIMELINE_RESERVATION_FAILURE_STREAK);
}

function markPolicyRejection(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_POLICY_REJECTION_TOTAL);
}

function markPipelineEntered(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_PIPELINE_ENTERED_TOTAL);
}

function markPublishSuccess(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_PUBLISH_SUCCESS_TOTAL);
  resetGauge(GAUGE_NAMES.TIMELINE_PUBLISH_FAILURE_STREAK);
}

function markPublishFailure(): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_PUBLISH_FAILURE_TOTAL);
  bumpGauge(GAUGE_NAMES.TIMELINE_PUBLISH_FAILURE_STREAK);
}

function markStateFailure(): void {
  bumpGauge(GAUGE_NAMES.TIMELINE_STORE_FAILURE_STREAK);
}

function markFunnelCounts(params: { scouted: number; normalized: number; ranked: number; selected: number }): void {
  incrementCounter(COUNTER_NAMES.TIMELINE_SCOUTED_TOTAL, params.scouted);
  incrementCounter(COUNTER_NAMES.TIMELINE_NORMALIZED_TOTAL, params.normalized);
  incrementCounter(COUNTER_NAMES.TIMELINE_RANKED_TOTAL, params.ranked);
  incrementCounter(COUNTER_NAMES.TIMELINE_SELECTED_TOTAL, params.selected);
}

async function getUserId(): Promise<string> {
  const user = await invokeXApiRequest<{ data: { id: string } }>({
    method: "GET",
    uri: "https://api.x.com/2/users/me",
  });
  return user.data.id;
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

export async function runTimelineEngagementIteration(): Promise<TimelineIterationStatus> {
  const config = readTimelineEngagementConfig();
  if (!config.enabled) {
    logInfo("[TIMELINE] Engagement disabled");
    return "disabled";
  }

  let stateFailureObserved = false;
  const noteStateFailure = (): void => {
    stateFailureObserved = true;
    markStateFailure();
  };

  const holderId = getHolderId();
  const lockResult = await tryAcquirePollLock(holderId);
  if (lockResult === "denied") {
    markLockDenied();
    logInfo("[TIMELINE] Not leader, skipping iteration");
    return "denied";
  }
  if (lockResult === "error") {
    markLockError();
    noteStateFailure();
    logWarn("[TIMELINE] Leader lock unavailable, aborting iteration");
    return "unavailable";
  }
  markLockAcquired();

  const dryRun = process.env.LAUNCH_MODE ? isPostingDisabled() : process.env.DRY_RUN === "true";
  const xClient = createXClient(dryRun);
  const llm = withCircuitBreaker(createUnifiedLLMClient());
  const botUserId = await getUserId();
  const deps: PipelineDeps = { llm, botUserId };
  const memory = new EngagementMemory();
  const compliance = readEngagementComplianceConfig();

  try {
    const scout = await scoutTimelineCandidates({
      sourceAccounts: config.sourceAccounts,
      keywordFilters: config.keywordFilters,
    });
    markFunnelCounts({ scouted: scout.tweets.length, normalized: 0, ranked: 0, selected: 0 });

    const normalized = scout.tweets.map((tweet) =>
      normalizeTimelineCandidate(
        tweet,
        scout.userMap.get(tweet.author_id) ?? tweet.author_id,
        scout.userMap.get(tweet.author_id) ?? "unknown"
      )
    );
    markFunnelCounts({ scouted: 0, normalized: normalized.length, ranked: 0, selected: 0 });

    const ranked = rankTimelineCandidates(normalized);
    markFunnelCounts({ scouted: 0, normalized: 0, ranked: ranked.length, selected: 0 });
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
        markPolicyRejection();
        logInfo("[TIMELINE] Candidate rejected by compliance", {
          tweetId: candidate.tweetId,
          decision: decision.decision,
          reason: decision.reason,
          consent: consent.state,
          energy: energy.band,
        });
        continue;
      }

      const policyDecision = await evaluateProactiveEngagementPolicy(candidate, config, memory);
      if (!policyDecision.allowed) {
        markPolicyRejection();
        logInfo("[TIMELINE] Candidate rejected by policy", {
          tweetId: candidate.tweetId,
          reason: policyDecision.reason,
          breakdown: candidate.scoreBreakdown,
        });
        continue;
      }

      candidate.selectedBecause.push("compliance_gate_allow");
      candidate.selectedBecause.push(`energy_${energy.band.toLowerCase()}`);
      candidate.selectedBecause.push(`consent_${consent.state.toLowerCase()}`);
      candidate.selectedBecause.push(`decision_${decision.decision.toLowerCase()}`);
      candidate.selectedBecause.push("policy_gate_allow");
      policyAllowed.push({ ...candidate, interactionKey });
    }

    const selection = selectTopTimelineCandidates(policyAllowed, config.maxPerRun);
    markFunnelCounts({ scouted: 0, normalized: 0, ranked: 0, selected: selection.selected.length });

    let publishedCount = 0;
    for (const candidate of selection.selected as Array<TimelineCandidate & { interactionKey?: string }>) {
      const interactionKey = candidate.interactionKey;

      try {
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

        markReservationAttempt();
        const reservation = await reserveLLMBudget(false);
        if (reservation.status === "denied") {
          markReservationFailure();
          logInfo("[TIMELINE] Candidate rejected by budget reservation", {
            tweetId: candidate.tweetId,
            reason: reservation.reason,
            used: reservation.used,
            limit: reservation.limit,
          });
          await releaseWritePreflight(preflight.interactionKey);
          continue;
        }
        if (reservation.status === "unavailable") {
          markReservationFailure();
          noteStateFailure();
          logWarn("[TIMELINE] Budget reservation unavailable, aborting iteration", {
            tweetId: candidate.tweetId,
            reason: reservation.reason,
          });
          await releaseWritePreflight(preflight.interactionKey);
          return "unavailable";
        }
        markReservationSuccess();
        candidate.selectedBecause.push("preflight_ok");
        candidate.selectedBecause.push("budget_reserved");

        markPipelineEntered();
        const rawTriggerInput = buildRawTriggerInputFromTimelineCandidate(candidate);
        const engagementCandidate = buildEngagementCandidate(rawTriggerInput);
        const conversationBundle = maybeBuildConversationBundle({
          candidate: engagementCandidate,
          sourceTweet: {
            tweetId: engagementCandidate.tweetId,
            conversationId: engagementCandidate.conversationId,
            authorId: engagementCandidate.authorId,
            normalizedText: engagementCandidate.normalizedText,
            discoveredAt: engagementCandidate.discoveredAt,
          },
          authorContext: {
            authorId: engagementCandidate.authorId,
            authorHandle:
              typeof rawTriggerInput.metadata?.authorHandle === "string"
                ? rawTriggerInput.metadata.authorHandle
                : undefined,
            sourceAccount:
              typeof rawTriggerInput.metadata?.sourceAccount === "string"
                ? rawTriggerInput.metadata.sourceAccount
                : undefined,
          },
          sourceMetadata: rawTriggerInput.metadata,
        });
        const event = toCanonicalExecutionInput(engagementCandidate, conversationBundle);
        const result = await handleEvent(event, deps, {
          ...DEFAULT_CANONICAL_CONFIG,
          model_id: DEFAULT_CANONICAL_CONFIG.model_id,
        });

        if (result.action !== "publish" || !result.reply_text) {
          markPublishFailure();
          logWarn("[TIMELINE] Candidate skipped by generation pipeline", {
            tweetId: candidate.tweetId,
            skipReason: result.action === "skip" ? result.skip_reason : "missing_reply_text",
          });
          await releaseWritePreflight(preflight.interactionKey);
          continue;
        }

        const publishResult = await publishWithRetry(event.event_id, async () => {
          const reply = await xClient.reply(result.reply_text, candidate.tweetId);
          return { tweetId: reply.id };
        });

        if (!publishResult.success || !publishResult.tweetId) {
          markPublishFailure();
          logWarn("[TIMELINE] Publish failed", { tweetId: candidate.tweetId, error: publishResult.error });
          await releaseWritePreflight(preflight.interactionKey);
          continue;
        }

        markPublishSuccess();
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
        noteStateFailure();
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
    if (!stateFailureObserved) {
      resetGauge(GAUGE_NAMES.TIMELINE_STORE_FAILURE_STREAK);
    }
    await recordPollSuccess();
    return "completed";
  } catch (error) {
    noteStateFailure();
    logWarn("[TIMELINE] Iteration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "unavailable";
  } finally {
    await releasePollLock(holderId);
  }
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
      const status = await runTimelineEngagementIteration();
      if (status === "denied" || status === "unavailable") {
        await sleep(POLL_LOCK_RETRY_MS);
        continue;
      }
    } catch (error) {
      logWarn("[TIMELINE] Iteration failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(config.intervalMs);
  }
}

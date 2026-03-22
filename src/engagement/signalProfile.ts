import type { EngagementCandidate } from "./candidateBoundary.js";
import type { ConversationBundle } from "./conversationBundle.js";

export type SignalStrength = "HIGH" | "MEDIUM" | "LOW";

export type FreshnessBucket = "very_fresh" | "fresh" | "aging" | "stale" | "unknown";

export type DiscussionState = "alive" | "slowing" | "cooled" | "stale" | "unknown";

export type DialogueState =
  | "open_dialogue"
  | "narrow_peer_exchange"
  | "broadcast_no_dialogue"
  | "adversarial_conflict"
  | "meme_or_irony"
  | "closed_social_exchange"
  | "unclear";

export type ConversationForm =
  | "BROAD_PUBLIC_DEBATE"
  | "NARROW_THREAD"
  | "BROADCAST_NO_DIALOGUE"
  | "MEME_OR_IRONY"
  | "ADVERSARIAL_CONFLICT"
  | "CLOSED_SOCIAL_EXCHANGE"
  | "NEWS_REACTION"
  | "UNKNOWN";

export type AuthorTypeGuess =
  | "researcher"
  | "clinician"
  | "founder_operator"
  | "investor"
  | "media_journalist"
  | "popularizer"
  | "layperson"
  | "anonymous_unclear"
  | "unknown";

export type SignalEvidenceStatus = "derived" | "heuristic" | "unknown";

export interface RelevanceSignals {
  topicFit: SignalStrength;
  technicalDepth: SignalStrength;
  discourseFit: SignalStrength;
  offTopicRisk: SignalStrength;
}

export interface AttentionSignals {
  freshnessBucket: FreshnessBucket;
  replyDensity: SignalStrength;
  visibleMomentum: SignalStrength;
  discussionState: DiscussionState;
  publicVisibilityLevel: SignalStrength;
}

export interface ParticipationFitSignals {
  threadOpenness: SignalStrength;
  entryPlausibility: SignalStrength;
  roomForUsefulContribution: SignalStrength;
  closedSocialExchangeRisk: SignalStrength;
  broadcastVsDialogueState: DialogueState;
  lateEntryRisk: SignalStrength;
}

export interface RiskSignals {
  adversarialConflictRisk: SignalStrength;
  ragebaitOrMemeRisk: SignalStrength;
  opportunisticReplyRisk: SignalStrength;
  pileOnRisk: SignalStrength;
  lowSubstanceRisk: SignalStrength;
  intimacyOrClosedGroupRisk: SignalStrength;
}

export interface MetaClassification {
  authorTypeGuess: AuthorTypeGuess;
  substanceLevel: SignalStrength;
  dialogueState: DialogueState;
  conversationForm: ConversationForm;
}

export interface SignalEvidenceStatusMap {
  relevance: SignalEvidenceStatus;
  attention: SignalEvidenceStatus;
  participationFit: SignalEvidenceStatus;
  risk: SignalEvidenceStatus;
  meta: SignalEvidenceStatus;
}

export interface SignalProfile {
  relevance: RelevanceSignals;
  attention: AttentionSignals;
  participationFit: ParticipationFitSignals;
  risk: RiskSignals;
  meta: MetaClassification;
  reasons?: string[];
  evidenceStatus?: SignalEvidenceStatusMap;
}

function clampSignalStrength(value: number): SignalStrength {
  if (value >= 0.67) return "HIGH";
  if (value >= 0.34) return "MEDIUM";
  return "LOW";
}

function normalizeText(text: string | undefined): string {
  return text?.trim() ?? "";
}

function countWords(text: string): number {
  return normalizeText(text).split(/\s+/).filter(Boolean).length;
}

function hasQuestionText(text: string): boolean {
  return /\?/.test(text) || /\b(can you|could you|help|what|why|how|should|would)\b/i.test(text);
}

function hasTechnicalText(text: string): boolean {
  return /\b(api|rpc|thread|schema|model|code|bug|deploy|contract|protocol|latency|data|json|type|test|stack|query|signal)\b/i.test(
    text
  );
}

function hasConflictText(text: string): boolean {
  return /\b(stupid|idiot|scam|fraud|liar|shill|clown|trash|nonsense)\b/i.test(text);
}

function hasMemeText(text: string): boolean {
  return /\b(lol|lmao|lmfao|haha|bro|wagmi|gm|ngl|fr|kek|ratio)\b/i.test(text) || /[😂🤣🔥💀]/.test(text);
}

function hasNewsReactionText(text: string): boolean {
  return /\b(news|breaking|update|announcement|report|reaction|headline)\b/i.test(text);
}

function readString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function inferAuthorType(authorHandle: string | undefined, sourceAccount: string | undefined): AuthorTypeGuess {
  const haystack = `${authorHandle ?? ""} ${sourceAccount ?? ""}`.toLowerCase();
  if (!haystack.trim()) return "unknown";
  if (/anon|incognito|burner|private/.test(haystack)) return "anonymous_unclear";
  if (/(research|lab|phd|dr\.?|scientist)/.test(haystack)) return "researcher";
  if (/(clinic|med|md\b|doctor|nurse)/.test(haystack)) return "clinician";
  if (/(founder|cofounder|ceo|operator|builder)/.test(haystack)) return "founder_operator";
  if (/(vc|invest|capital|fund|angel)/.test(haystack)) return "investor";
  if (/(journal|news|media|press|reporter)/.test(haystack)) return "media_journalist";
  if (/(popular|explainer|educator|teacher)/.test(haystack)) return "popularizer";
  return "layperson";
}

function inferFreshnessBucket(discoveredAt: string): FreshnessBucket {
  const createdAtMs = Date.parse(discoveredAt);
  if (!Number.isFinite(createdAtMs)) return "unknown";

  const ageHours = Math.max(0, (Date.now() - createdAtMs) / 3_600_000);
  if (ageHours < 1) return "very_fresh";
  if (ageHours < 6) return "fresh";
  if (ageHours < 24) return "aging";
  return "stale";
}

function inferDialogueState(params: {
  text: string;
  hasParentRef: boolean;
  triggerType: EngagementCandidate["triggerType"];
}): DialogueState {
  if (hasConflictText(params.text)) return "adversarial_conflict";
  if (hasMemeText(params.text)) return "meme_or_irony";
  if (params.hasParentRef && hasQuestionText(params.text)) {
    return params.triggerType === "mention" ? "open_dialogue" : "narrow_peer_exchange";
  }
  if (params.hasParentRef) return "narrow_peer_exchange";
  if (hasQuestionText(params.text)) return "open_dialogue";
  if (params.text.length > 0) return "broadcast_no_dialogue";
  return "unclear";
}

function inferConversationForm(params: {
  dialogueState: DialogueState;
  hasParentRef: boolean;
  text: string;
}): ConversationForm {
  if (params.dialogueState === "adversarial_conflict") return "ADVERSARIAL_CONFLICT";
  if (params.dialogueState === "meme_or_irony") return "MEME_OR_IRONY";
  if (params.hasParentRef) return "NARROW_THREAD";
  if (hasNewsReactionText(params.text)) return "NEWS_REACTION";
  if (params.dialogueState === "broadcast_no_dialogue") return "BROADCAST_NO_DIALOGUE";
  if (params.dialogueState === "open_dialogue") return "BROAD_PUBLIC_DEBATE";
  return "UNKNOWN";
}

function inferSubstanceLevel(text: string, candidate: EngagementCandidate, bundle?: ConversationBundle): SignalStrength {
  const words = countWords(text);
  const timelineScore = readNumber(candidate.sourceMetadata, "finalScore");
  const sourceScore = readNumber(bundle?.sourceMetadata, "finalScore") ?? timelineScore;

  if ((sourceScore ?? 0) >= 20 || (words >= 24 && hasTechnicalText(text))) return "HIGH";
  if ((words >= 12 && hasQuestionText(text)) || words >= 18 || hasTechnicalText(text)) return "MEDIUM";
  return "LOW";
}

function inferConversationSignals(
  candidate: EngagementCandidate,
  bundle?: ConversationBundle
): {
  hasParentRef: boolean;
  text: string;
  freshnessBucket: FreshnessBucket;
  visibleMomentum: SignalStrength;
  discussionState: DiscussionState;
  publicVisibilityLevel: SignalStrength;
  authorTypeGuess: AuthorTypeGuess;
  substanceLevel: SignalStrength;
  dialogueState: DialogueState;
  conversationForm: ConversationForm;
} {
  const text = normalizeText(candidate.normalizedText ?? bundle?.sourceTweet?.normalizedText);
  const parentRef = bundle?.parentRef ?? candidate.parentRef;
  const hasParentRef = Boolean(parentRef?.tweetId || parentRef?.conversationId || parentRef?.authorId);
  const freshnessBucket = inferFreshnessBucket(candidate.discoveredAt);
  const authorHandle =
    readString(candidate.sourceMetadata, "authorHandle") ?? readString(bundle?.sourceMetadata, "authorHandle");
  const sourceAccount =
    readString(candidate.sourceMetadata, "sourceAccount") ?? readString(bundle?.sourceMetadata, "sourceAccount");
  const authorTypeGuess = inferAuthorType(authorHandle, sourceAccount);
  const substanceLevel = inferSubstanceLevel(text, candidate, bundle);
  const dialogueState = inferDialogueState({
    text,
    hasParentRef,
    triggerType: candidate.triggerType,
  });
  const conversationForm = inferConversationForm({
    dialogueState,
    hasParentRef,
    text,
  });
  const visibleScore = readNumber(bundle?.sourceMetadata ?? candidate.sourceMetadata, "finalScore") ?? 0;
  const visibleMomentum: SignalStrength =
    visibleScore >= 20 ? "HIGH" : visibleScore >= 8 ? "MEDIUM" : hasParentRef ? "MEDIUM" : "LOW";

  const discussionState: DiscussionState =
    freshnessBucket === "very_fresh" || freshnessBucket === "fresh"
      ? hasParentRef
        ? "alive"
        : "slowing"
      : freshnessBucket === "aging"
        ? "cooled"
        : freshnessBucket === "stale"
          ? "stale"
          : "unknown";

  const publicVisibilityLevel: SignalStrength =
    candidate.triggerType === "timeline" ? "HIGH" : hasParentRef ? "MEDIUM" : "LOW";

  return {
    hasParentRef,
    text,
    freshnessBucket,
    visibleMomentum,
    discussionState,
    publicVisibilityLevel,
    authorTypeGuess,
    substanceLevel,
    dialogueState,
    conversationForm,
  };
}

export function assembleSignalProfile(
  candidate: EngagementCandidate,
  bundle?: ConversationBundle
): SignalProfile {
  const signals = inferConversationSignals(candidate, bundle);
  const text = signals.text;
  const words = countWords(text);
  const hasParentRef = signals.hasParentRef;
  const hasTechnical = hasTechnicalText(text);
  const hasDialogue = hasQuestionText(text);
  const conflictRisk = hasConflictText(text);
  const memeRisk = hasMemeText(text);
  const conversationForm = signals.conversationForm;

  const relevance: RelevanceSignals = {
    topicFit: hasParentRef || hasDialogue || hasTechnical ? clampSignalStrength(words / 10) : "LOW",
    technicalDepth: hasTechnical ? clampSignalStrength(words / 12) : "LOW",
    discourseFit: hasParentRef || hasDialogue ? (hasParentRef && hasDialogue ? "HIGH" : "MEDIUM") : "LOW",
    offTopicRisk:
      conversationForm === "BROADCAST_NO_DIALOGUE"
        ? "HIGH"
        : hasParentRef || hasDialogue || hasTechnical
          ? "LOW"
          : "MEDIUM",
  };

  const attention: AttentionSignals = {
    freshnessBucket: signals.freshnessBucket,
    replyDensity: hasParentRef ? "HIGH" : candidate.conversationId ? "MEDIUM" : "LOW",
    visibleMomentum: signals.visibleMomentum,
    discussionState: signals.discussionState,
    publicVisibilityLevel: signals.publicVisibilityLevel,
  };

  const participationFit: ParticipationFitSignals = {
    threadOpenness: hasParentRef ? "HIGH" : candidate.conversationId ? "MEDIUM" : "LOW",
    entryPlausibility: hasParentRef && hasDialogue ? "HIGH" : hasDialogue || signals.substanceLevel !== "LOW" ? "MEDIUM" : "LOW",
    roomForUsefulContribution:
      hasParentRef && signals.substanceLevel !== "LOW"
        ? "HIGH"
        : signals.substanceLevel === "HIGH" || hasDialogue
          ? "MEDIUM"
          : "LOW",
    closedSocialExchangeRisk:
      conversationForm === "CLOSED_SOCIAL_EXCHANGE"
        ? "HIGH"
        : conversationForm === "BROADCAST_NO_DIALOGUE" && words < 12
          ? "MEDIUM"
          : "LOW",
    broadcastVsDialogueState: signals.dialogueState,
    lateEntryRisk:
      signals.freshnessBucket === "stale"
        ? "HIGH"
        : signals.freshnessBucket === "aging"
          ? "MEDIUM"
          : "LOW",
  };

  const risk: RiskSignals = {
    adversarialConflictRisk: conflictRisk ? "HIGH" : signals.dialogueState === "adversarial_conflict" ? "HIGH" : "LOW",
    ragebaitOrMemeRisk: memeRisk ? "HIGH" : words < 6 ? "MEDIUM" : "LOW",
    opportunisticReplyRisk: !hasParentRef ? (candidate.triggerType === "timeline" ? "HIGH" : "MEDIUM") : "LOW",
    pileOnRisk: conflictRisk && hasParentRef ? "HIGH" : conflictRisk ? "MEDIUM" : "LOW",
    lowSubstanceRisk:
      signals.substanceLevel === "LOW" ? "HIGH" : signals.substanceLevel === "MEDIUM" ? "MEDIUM" : "LOW",
    intimacyOrClosedGroupRisk:
      conversationForm === "CLOSED_SOCIAL_EXCHANGE"
        ? "HIGH"
        : hasParentRef && signals.publicVisibilityLevel === "LOW"
          ? "MEDIUM"
          : "LOW",
  };

  const meta: MetaClassification = {
    authorTypeGuess: signals.authorTypeGuess,
    substanceLevel: signals.substanceLevel,
    dialogueState: signals.dialogueState,
    conversationForm,
  };

  const reasons: string[] = [];
  if (hasParentRef) reasons.push("parent_ref_available");
  else reasons.push("no_parent_ref");
  if (hasDialogue) reasons.push("dialogue_cue_present");
  if (hasTechnical) reasons.push("technical_language_present");
  if (conflictRisk) reasons.push("conflict_language_present");
  if (memeRisk) reasons.push("meme_language_present");
  if (readNumber(bundle?.sourceMetadata ?? candidate.sourceMetadata, "finalScore") !== undefined) {
    reasons.push("timeline_score_available");
  }

  const evidenceStatus: SignalEvidenceStatusMap = {
    relevance: hasDialogue || hasTechnical || hasParentRef ? "heuristic" : "unknown",
    attention: candidate.discoveredAt ? "derived" : "unknown",
    participationFit: hasParentRef || candidate.conversationId ? "heuristic" : "unknown",
    risk: text ? "heuristic" : "unknown",
    meta: signals.authorTypeGuess === "unknown" ? "unknown" : "heuristic",
  };

  return {
    relevance,
    attention,
    participationFit,
    risk,
    meta,
    reasons,
    evidenceStatus,
  };
}

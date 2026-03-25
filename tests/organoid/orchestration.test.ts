import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, getAllEmbodiments } from "../../src/embodiments/registry.js";
import { loadEmbodiments } from "../../src/embodiments/loadEmbodiments.js";
import type { CanonicalEvent, ClassifierOutput, ScoreBundle, ThesisBundle } from "../../src/canonical/types.js";
import {
  ORGANOID_PHASES,
  buildOrganoidOrchestration,
  decomposeOrganoidSignals,
  formatOrganoidPromptBlock,
  inferOrganoidPhase,
  normalizeOrganoidContract,
  resolveRenderableEmbodimentIds,
} from "../../src/organoid/orchestration.js";

function makeEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    event_id: "organoid_1",
    platform: "twitter",
    trigger_type: "mention",
    author_handle: "@user",
    author_id: "user_1",
    text: "$SOL is a fake 100x promise with no proof",
    parent_text: null,
    quoted_text: null,
    conversation_context: [],
    cashtags: ["$SOL"],
    hashtags: [],
    urls: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeClassifier(overrides: Partial<ClassifierOutput> = {}): ClassifierOutput {
  return {
    intent: "question",
    target: "claim",
    evidence_class: "contextual_medium",
    bait_probability: 0.12,
    spam_probability: 0,
    policy_blocked: false,
    evidence_bullets: [],
    risk_flags: [],
    ...overrides,
  };
}

function makeScores(overrides: Partial<ScoreBundle> = {}): ScoreBundle {
  return {
    relevance: 0.72,
    confidence: 0.63,
    severity: 0.42,
    opportunity: 0.58,
    risk: 0.18,
    novelty: 0.31,
    ...overrides,
  };
}

function makeThesis(): ThesisBundle {
  return {
    primary: "claim_exceeds_evidence",
    supporting_point: "the claim is louder than the evidence",
    evidence_bullets: ["no proof", "big promise"],
  };
}

describe("organoid orchestration", () => {
  beforeEach(async () => {
    clearRegistry();
    await loadEmbodiments();
  });

  it("builds a canonical plan with phase and resonance metadata", () => {
    const embodiments = getAllEmbodiments();
    const signal = decomposeOrganoidSignals({
      event: makeEvent(),
      cls: makeClassifier(),
      scores: makeScores(),
      thesis: makeThesis(),
    });
    const phase = inferOrganoidPhase({
      signal,
      scores: makeScores(),
      thesis: makeThesis(),
      mode: "analyst_meme_lite",
    });
    expect(ORGANOID_PHASES).toContain(phase.activePhase);

    const plan = buildOrganoidOrchestration({
      event: makeEvent(),
      cls: makeClassifier(),
      scores: makeScores(),
      thesis: makeThesis(),
      mode: "analyst_meme_lite",
      embodiments,
      selectedEmbodimentId: "stillhalter",
      state: {
        recentPhases: [],
        recentEmbodimentIds: ["stillhalter"],
        matrixBias: {},
        driftPressure: 0.2,
        coherence: 0.7,
      },
    });

    expect(plan.validation.ok).toBe(true);
    expect(ORGANOID_PHASES).toContain(plan.phase.activePhase);
    expect(plan.contractVersion).toBe(1);
    expect(plan.leadEmbodimentId).toBeTruthy();
    expect(plan.counterweightEmbodimentId).toBeTruthy();
    expect(plan.anchorEmbodimentId).toBeTruthy();
    expect(plan.silencePolicy).toMatch(/^(speak|speak_brief|caution_only|stabilize_only|silence)$/);
    expect(plan.renderPolicy).toMatch(/^(lead_only|lead_plus_anchor|lead_plus_counterweight|multi_internal_single_external|suppress_external_multi)$/);
    expect(plan.resonance.length).toBeGreaterThan(0);
    expect(plan.activeEmbodimentIds.length).toBeGreaterThan(0);
    expect(plan.expression.glyphPrefix).toMatch(/./);
    expect(plan.dominantEmbodimentId).toBeTruthy();
  });

  it("normalizes renderable embodiments based on policy", () => {
    const embodiments = getAllEmbodiments();
    const plan = buildOrganoidOrchestration({
      event: makeEvent(),
      cls: makeClassifier(),
      scores: makeScores(),
      thesis: makeThesis(),
      mode: "analyst_meme_lite",
      embodiments,
      selectedEmbodimentId: "stillhalter",
      state: {
        recentPhases: [],
        recentEmbodimentIds: ["stillhalter"],
        matrixBias: {},
        driftPressure: 0.2,
        coherence: 0.7,
      },
    });

    const normalized = normalizeOrganoidContract({
      ...plan,
      renderPolicy: "lead_plus_anchor",
      anchorEmbodimentId: "glutkern",
      counterweightEmbodimentId: "nebelspieler",
    });
    expect(resolveRenderableEmbodimentIds(normalized)).toEqual([normalized.leadEmbodimentId, "glutkern"]);
  });

  it("maps hard policy states to silence and suppresses the external multi surface", () => {
    const embodiments = getAllEmbodiments();
    const plan = buildOrganoidOrchestration({
      event: makeEvent({ text: "policy heavy", parent_text: "hard safety context" }),
      cls: makeClassifier({ policy_blocked: true, policy_severity: "hard" }),
      scores: makeScores({ confidence: 0.21, risk: 0.92, severity: 0.74 }),
      thesis: makeThesis(),
      mode: "hard_caution",
      embodiments,
      selectedEmbodimentId: "stillhalter",
      state: {
        recentPhases: [],
        recentEmbodimentIds: ["stillhalter"],
        matrixBias: {},
        driftPressure: 0.9,
        coherence: 0.2,
      },
    });

    expect(plan.silencePolicy).toBe("silence");
    expect(plan.orchestrationMode).toBe("silence");
    expect(plan.renderPolicy).toBe("suppress_external_multi");
    expect(plan.expression.lengthHint).toBe(0);
    expect(resolveRenderableEmbodimentIds(plan)).toEqual([plan.leadEmbodimentId]);
  });

  it("formats a prompt block that exposes the orchestration plan", () => {
    const embodiments = getAllEmbodiments();
    const plan = buildOrganoidOrchestration({
      event: makeEvent(),
      cls: makeClassifier(),
      scores: makeScores(),
      thesis: makeThesis(),
      mode: "analyst_meme_lite",
      embodiments,
      selectedEmbodimentId: "stillhalter",
    });

    const lines = formatOrganoidPromptBlock(plan);
    expect(lines[0]).toBe("Organoid matrix:");
    expect(lines.join("\n")).toContain("phase:");
    expect(lines.join("\n")).toContain("lead:");
    expect(lines.join("\n")).toContain("silence policy:");
    expect(lines.join("\n")).toContain("render policy:");
  });
});

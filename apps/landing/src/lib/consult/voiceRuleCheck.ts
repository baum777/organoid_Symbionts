// Output guard: checks an LLM-generated answer against the
// per-context voice rules from § 6.3 of
// docs/methodology/coaching-contexts.md.
//
// Run this after the LLM returns and before the response ships.
// In Week 3 (stub mode) violations are collected but not blocking —
// stub answers use fixed sampleQuotes which may trip some rules.
// In Week 4 (LLM mode) a violation → retry once; on second
// violation → fall back to stub answer.
//
// Rules are grouped:
//   universal   — applies to all contexts
//   life        — only when context === "life"
//   reflection  — only when context === "reflection"
//   creative    — only when context === "creative"

import type { ConsultContext } from "@/lib/consult/constants";

export type VoiceRuleViolation = {
  pattern: string;
  scope: "universal" | ConsultContext;
};

export type VoiceRuleResult =
  | { valid: true }
  | { valid: false; violations: readonly VoiceRuleViolation[] };

type RuleEntry = {
  pattern: RegExp;
  label: string;
};

// ── Universal rules ───────────────────────────────────────────────────
// Outcome promises, false certainty, sentience claims, stateful
// references ("you told me last time …").

const UNIVERSAL_RULES: readonly RuleEntry[] = [
  { pattern: /\bdu wirst\b/i, label: "outcome_promise_de" },
  { pattern: /\byou will\b/i, label: "outcome_promise_en" },
  { pattern: /\bdas wird heilen\b/i, label: "healing_promise_de" },
  { pattern: /\bthis will heal\b/i, label: "healing_promise_en" },
  { pattern: /\bdie antwort ist\b/i, label: "false_certainty_de" },
  { pattern: /\bthe answer is\b/i, label: "false_certainty_en" },
  { pattern: /\bich weiß,? wer du bist\b/i, label: "sentience_claim_de" },
  { pattern: /\bi know who you are\b/i, label: "sentience_claim_en" },
  { pattern: /\bdein leben wird sich verändern\b/i, label: "life_change_promise_de" },
  { pattern: /\byour life will change\b/i, label: "life_change_promise_en" },
];

// ── Reflection-specific rules ─────────────────────────────────────────
// Clinicalization, pattern-labeling, healing claims in the
// therapy-adjacent context.

const REFLECTION_RULES: readonly RuleEntry[] = [
  { pattern: /\bheilen\b/i, label: "heal_de" },
  { pattern: /\bheal\b/i, label: "heal_en" },
  { pattern: /\bdein problem ist\b/i, label: "problem_label_de" },
  { pattern: /\byour problem is\b/i, label: "problem_label_en" },
  { pattern: /\bdein muster ist\b/i, label: "pattern_label_de" },
  { pattern: /\byour pattern is\b/i, label: "pattern_label_en" },
  { pattern: /\bdein trauma ist\b/i, label: "trauma_label_de" },
  { pattern: /\byour trauma is\b/i, label: "trauma_label_en" },
  { pattern: /\bdiagnostizier\b/i, label: "diagnose_de" },
  { pattern: /\bdiagnose\b/i, label: "diagnose_en" },
];

// ── Life-specific rules ───────────────────────────────────────────────
// Absolute directives — the matrix holds questions, it does not command.

const LIFE_RULES: readonly RuleEntry[] = [
  { pattern: /\bdu musst\b/i, label: "must_de" },
  { pattern: /\byou must\b/i, label: "must_en" },
  { pattern: /\bdu solltest unbedingt\b/i, label: "you_should_absolutely_de" },
  { pattern: /\byou absolutely should\b/i, label: "you_should_absolutely_en" },
  { pattern: /\bdie einzige option\b/i, label: "only_option_de" },
  { pattern: /\bthe only option\b/i, label: "only_option_en" },
];

// ── Creative-specific rules ───────────────────────────────────────────
// Ghost-writing markers — the matrix is a writing partner, not a writer.

const CREATIVE_RULES: readonly RuleEntry[] = [
  { pattern: /\bhier ist dein text\b/i, label: "ghostwrite_de" },
  { pattern: /\bhier ist deine szene\b/i, label: "ghostwrite_scene_de" },
  { pattern: /\bhere is your (text|essay|scene|story|chapter)\b/i, label: "ghostwrite_en" },
  { pattern: /\bdie lösung ist\b/i, label: "solution_claim_de" },
  { pattern: /\bthe solution is\b/i, label: "solution_claim_en" },
];

const CONTEXT_RULES: Record<ConsultContext, readonly RuleEntry[]> = {
  life: LIFE_RULES,
  reflection: REFLECTION_RULES,
  creative: CREATIVE_RULES,
};

function checkRules(
  answer: string,
  rules: readonly RuleEntry[],
  scope: "universal" | ConsultContext,
): VoiceRuleViolation[] {
  const violations: VoiceRuleViolation[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(answer)) {
      violations.push({ pattern: rule.label, scope });
    }
  }
  return violations;
}

export function checkVoiceRules(
  answer: string,
  context: ConsultContext,
): VoiceRuleResult {
  const violations: VoiceRuleViolation[] = [
    ...checkRules(answer, UNIVERSAL_RULES, "universal"),
    ...checkRules(answer, CONTEXT_RULES[context], context),
  ];

  if (violations.length === 0) {
    return { valid: true };
  }
  return { valid: false, violations };
}

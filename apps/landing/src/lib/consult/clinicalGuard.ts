// Clinical-topic guard for the /api/consult endpoint.
//
// Classifies the raw signal before any LLM call or stub render.
// Returns a GuardResult that the consult-runner maps to a
// deflection mode (hard_caution or soft_deflection) without
// ever forwarding the signal to the LLM.
//
// Three severity tiers (§ 6.2 of docs/methodology/coaching-contexts.md):
//   crisis       → hard_caution + crisis resource overlay
//   clinical     → soft_deflection (diagnosis / treatment scope)
//   out_of_scope → soft_deflection (context-specific: legal/financial/
//                  plagiarism/defamation)
//   moderation   → soft_deflection + server-side moderation log
//
// Matching is case-insensitive substring. No regex complexity —
// keep the list readable so a non-engineer can audit it.

import type { ConsultContext } from "@/lib/consult/constants";

export type GuardCategory = "crisis" | "clinical" | "out_of_scope" | "moderation";

export type GuardResult =
  | { matched: false }
  | { matched: true; category: GuardCategory; terms: readonly string[] };

// ── Crisis ────────────────────────────────────────────────────────────
// Self-harm ideation, suicidality, acute psychiatric distress.
// Any match → hard_caution + crisis resource, no LLM call.

const CRISIS_TERMS: readonly string[] = [
  // DE
  "suizid",
  "selbstmord",
  "selbstverletzung",
  "mich umbringen",
  "nicht mehr leben",
  "sterben wollen",
  "ich will sterben",
  "keine lust mehr zu leben",
  "aufhören zu existieren",
  "mir etwas antun",
  "mir selbst wehtun",
  "psychose",
  "halluzination",
  "stimmen hören",
  "akute psychiatrische",
  // EN
  "suicide",
  "suicidal",
  "self-harm",
  "self harm",
  "kill myself",
  "end my life",
  "don't want to live",
  "dont want to live",
  "want to die",
  "hurt myself",
  "hearing voices",
  "psychotic episode",
];

// ── Clinical ──────────────────────────────────────────────────────────
// Diagnosis, treatment, prescription, healing requests.
// The matrix is a reflection companion — never a clinician.

const CLINICAL_TERMS: readonly string[] = [
  // DE
  "diagnose stellen",
  "diagnostizier",
  "bin ich borderline",
  "bin ich narzisstisch",
  "bin ich bipolar",
  "bin ich adhs",
  "habe ich adhs",
  "habe ich borderline",
  "medikament verschreiben",
  "therapieempfehlung",
  "treatment plan",
  "heile mich",
  "fix mich",
  "reparier mich",
  "bin ich krank",
  "was ist meine diagnose",
  // EN
  "diagnose me",
  "am i borderline",
  "am i narcissistic",
  "am i bipolar",
  "do i have adhd",
  "do i have borderline",
  "heal me",
  "fix me",
  "prescribe me",
  "clinical diagnosis",
  "medication recommendation",
  "what is my diagnosis",
  "am i mentally ill",
];

// ── Out-of-scope: Life context ─────────────────────────────────────────
// Medical, legal, financial advice — hard out-of-scope for Life.

const OUT_OF_SCOPE_LIFE: readonly string[] = [
  // DE
  "steuerberatung",
  "steuerliche beratung",
  "rechtsberatung",
  "rechtlich beraten",
  "anwalt fragen",
  "medizinischer rat",
  "ärztliche beratung",
  "arzt empfehlen",
  // EN
  "tax advice",
  "tax consultant",
  "legal advice",
  "lawyer recommendation",
  "medical advice",
  "doctor's advice",
  "financial advice",
];

// ── Out-of-scope: Creative context ────────────────────────────────────
// Ghost-writing / homework / plagiarism requests.

const OUT_OF_SCOPE_CREATIVE: readonly string[] = [
  // DE
  "schreib mir einen aufsatz",
  "schreib meine hausarbeit",
  "schreib mein essay",
  "mach meine hausaufgaben",
  "erstell meinen aufsatz",
  "schreib meine bachelorarbeit",
  "schreib meine masterarbeit",
  "schreib meine seminararbeit",
  // EN
  "write my essay",
  "write my thesis",
  "write my homework",
  "do my homework",
  "do my assignment",
  "complete my assignment",
  "write my paper",
  "write my dissertation",
];

// ── Moderation ────────────────────────────────────────────────────────
// Defamation, targeted harassment. Triggers soft_deflection +
// a server-side moderation log event (see consult-runner.ts).

const MODERATION_TERMS: readonly string[] = [
  // DE
  "schreib etwas schlechtes über",
  "schreib etwas böses über",
  "schreib etwas negatives über",
  "diffamier",
  "hetze gegen",
  "schreib einen hasskommentar über",
  // EN
  "write something mean about",
  "write something negative about",
  "write something bad about",
  "defame",
  "trash talk",
  "write hate about",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function firstMatch(
  signal: string,
  terms: readonly string[],
): readonly string[] | null {
  const norm = normalize(signal);
  const hits: string[] = [];
  for (const term of terms) {
    if (norm.includes(normalize(term))) {
      hits.push(term);
    }
  }
  return hits.length > 0 ? hits : null;
}

export function classifySignal(
  signal: string,
  context: ConsultContext,
): GuardResult {
  // 1. Crisis — highest priority, context-independent.
  const crisisHits = firstMatch(signal, CRISIS_TERMS);
  if (crisisHits) {
    return { matched: true, category: "crisis", terms: crisisHits };
  }

  // 2. Clinical — context-independent.
  const clinicalHits = firstMatch(signal, CLINICAL_TERMS);
  if (clinicalHits) {
    return { matched: true, category: "clinical", terms: clinicalHits };
  }

  // 3. Moderation — context-independent.
  const moderationHits = firstMatch(signal, MODERATION_TERMS);
  if (moderationHits) {
    return { matched: true, category: "moderation", terms: moderationHits };
  }

  // 4. Out-of-scope — context-dependent.
  if (context === "life") {
    const scopeHits = firstMatch(signal, OUT_OF_SCOPE_LIFE);
    if (scopeHits) {
      return { matched: true, category: "out_of_scope", terms: scopeHits };
    }
  }
  if (context === "creative") {
    const scopeHits = firstMatch(signal, OUT_OF_SCOPE_CREATIVE);
    if (scopeHits) {
      return { matched: true, category: "out_of_scope", terms: scopeHits };
    }
  }

  return { matched: false };
}

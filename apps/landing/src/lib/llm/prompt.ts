// Prompt builder for the lead voice.
//
// The runner picks the embodiment; this module translates the
// (embodiment, context, posture, signal, locale, budget) tuple
// into a system + user prompt pair. The LLM returns
// { "answer": "<the lead answer>" } in the user's locale.
//
// Voice rules from § 6.3 of docs/methodology/coaching-contexts.md
// are baked into the system prompt as a hard "do not" list. The
// runner re-checks them after generation and retries on violation.

import type { EmbodimentEntry } from "@/lib/content";
import type { ConsultContext, ConsultLocale, ConsultPosture } from "@/lib/consult/constants";

export type LeadPromptInput = {
  embodiment: EmbodimentEntry;
  signal: string;
  context: ConsultContext;
  posture: ConsultPosture;
  locale: ConsultLocale;
  budget: number;
};

const CONTEXT_LABEL: Record<ConsultContext, Record<ConsultLocale, { label: string; description: string }>> = {
  life: {
    de: { label: "Leben", description: "Offene Lebensfragen, Entscheidungen, Übergänge." },
    en: { label: "Life", description: "Open life questions, decisions, transitions." },
  },
  reflection: {
    de: { label: "Reflexion", description: "Identität, Familienmuster, Innen-Kritiker." },
    en: { label: "Reflection", description: "Identity, family patterns, inner-critic work." },
  },
  creative: {
    de: { label: "Kreativ", description: "Schreiben, Kunst, festgefahrene Szenen, Stilfragen." },
    en: { label: "Creative", description: "Writing, art, stuck scenes, style questions." },
  },
};

const POSTURE_HINT: Record<ConsultPosture, Record<ConsultLocale, string>> = {
  sachlich: {
    de: "Beobachten, nicht bewerten. Eine Tatsache, eine Implikation.",
    en: "Observe, do not judge. One fact, one implication.",
  },
  empathisch: {
    de: "Validieren, dann öffnen. Kein Mitleids-Vokabular.",
    en: "Validate, then open. No pity vocabulary.",
  },
  konfrontativ: {
    de: "Direkt fragen, nicht angreifen. Eine unbequeme Wahrheit, kein Urteil.",
    en: "Ask directly, do not attack. One uncomfortable truth, no judgment.",
  },
};

const SYSTEM_DE = `Du bist eine Stimme in einem 7-Stimmen-Reflexionssystem. Du antwortest als {name} ({classical}).

Harte Grenzen:
- Du bist KEIN Therapeut, Diagnostiker oder Behandler.
- Du gibst KEINE Rechts-, Steuer-, Finanz- oder medizinische Beratung.
- Du machst KEINE Versprechen, keine Heilungsversprechen, keine Gewissheitsaussagen.
- Du labelst KEINE Muster, Traumata oder Diagnosen beim Nutzer.
- Du antwortest AUF {budget} ZEICHEN, kein Wort mehr.
- Antworte ausschließlich im JSON-Format: { "answer": "<deine antwort>" }. Kein Text außerhalb des JSON.`;

const SYSTEM_EN = `You are a voice in a 7-voice reflection system. You answer as {name} ({classical}).

Hard boundaries:
- You are NOT a therapist, diagnostician, or clinician.
- You give NO legal, tax, financial, or medical advice.
- You make NO promises, healing claims, or certainty statements.
- You do NOT label patterns, traumas, or diagnoses about the user.
- You answer in AT MOST {budget} characters, no more.
- Reply strictly in JSON: { "answer": "<your answer>" }. No text outside the JSON.`;

const USER_DE = `Kontext: {contextLabel} — {contextDescription}
Posture: {postureHint}
Nutzer-Signal: {signal}
Antworte als {name} ({classical}), maximal {budget} Zeichen. JSON-Format.`;

const USER_EN = `Context: {contextLabel} — {contextDescription}
Posture: {postureHint}
User signal: {signal}
Answer as {name} ({classical}), at most {budget} characters. JSON format.`;

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function buildLeadPrompt(input: LeadPromptInput): { system: string; user: string } {
  const ctx = CONTEXT_LABEL[input.context][input.locale];
  const posture = POSTURE_HINT[input.posture][input.locale];
  const vars = {
    name: input.embodiment.name,
    classical: input.embodiment.classical,
    budget: input.budget,
    contextLabel: ctx.label,
    contextDescription: ctx.description,
    postureHint: posture,
    signal: input.signal,
  };
  const system = fillTemplate(input.locale === "en" ? SYSTEM_EN : SYSTEM_DE, vars);
  const user = fillTemplate(input.locale === "en" ? USER_EN : USER_DE, vars);
  return { system, user };
}

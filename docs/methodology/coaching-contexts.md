# Coaching Contexts — Mapping 3 Kontexte auf das Mode-System

Status: planning artifact, not implemented. Bridges the existing `src/canonical/modeBudgets.ts` and `src/canonical/modeSelector.ts` to the three coaching contexts (Life / Reflection / Creative) defined for the Practice surface.

## 1. Scope

The canonical pipeline ships with 11 modes in `src/canonical/modeBudgets.ts` (see `MODE_BUDGETS`, lines 3–15) and a `selectMode()` function in `src/canonical/modeSelector.ts` (line 21) that maps `ClassifierOutput` + `ScoreBundle` + `ThesisBundle` + `CanonicalConfig` to one of those modes.

Those modes were designed for **X engagement** (social banter, market banter, embodiment reply, lore drop, conversation hook). The Practice surface needs the same orchestrator but tuned for **coaching** contexts, where the failure modes are different:

- "Boring or generic" instead of "off-brand"
- "Therapy-claim" instead of "harassment"
- "Hallucinated insight" instead of "factual error"
- "Stuck in one voice" instead of "off-topic"

This document maps the 3 coaching contexts to:

1. A **default mode** (the orchestrator's first choice)
2. A **mode ladder** (how the orchestrator moves if the input is heavier or lighter than expected)
3. A **posture overlay** (how the user's chosen posture — sachlich / empathisch / konfrontativ — shifts the orchestrator config)
4. An **embodiment preference** (which of the 7 embodiments tends to lead in this context)
5. A **voice rule** (what the lead is allowed to claim, what it must hedge)
6. A **compliance guard** (what must never appear in the answer)

The mappings are **runtime config**, not code changes. They are consumed by the `CanonicalConfig` argument of `selectMode()` (see `modeSelector.ts:25`) and by the consult-runner wrapper described in `docs/landing-practice-route.md § 7`.

## 2. The 3 Contexts

### 2.1 Life — "Life / Personal Growth"

- **What the user brings**: open life questions, relationship decisions, work/transition choices, sense of direction.
- **Tone the user wants**: warm, but not saccharine. Honest, but not brutal. The matrix is a thinking partner, not a fortune teller.
- **Typical signal length**: 80–800 chars.
- **What success looks like**: the user leaves with 1 sentence they can carry + 1 question to sit with.

### 2.2 Reflection — "Therapy-adjacent / Self-reflection"

- **What the user brings**: family patterns, inner critic, grief, identity questions, "who am I when I stop performing."
- **Tone the user wants**: stable, slow, validating-but-not-therapizing. The matrix holds space; it does not diagnose.
- **Typical signal length**: 200–2000 chars.
- **What success looks like**: the user feels *seen by a structure*, not *analyzed by a person*. The 7-embodiment frame should feel like IFS or Voice Dialogue in solo form.
- **Compliance ceiling (hard)**: this is **not therapy**. The system must never claim diagnosis, healing, treatment, or clinical authority. The phrase "reflection companion" is the only acceptable framing. See § 6.

### 2.3 Creative — "Creative / Writing / Art"

- **What the user brings**: writing block, character stuck, plot knot, style question, "what is this piece actually about."
- **Tone the user wants**: sharp, occasionally funny, willing to be inconvenient. The matrix is a writing partner that pushes back, not a cheerleader.
- **Typical signal length**: 100–1500 chars.
- **What success looks like**: the user gets 1 actionable exercise or 1 reframing they can take to the page in the next 5 minutes.

## 3. Context → Mode Mapping

This is the core table. All references are to `src/canonical/modeBudgets.ts:3` (`MODE_BUDGETS`) and `src/canonical/modeSelector.ts:21` (`selectMode`).

| Mode | soft_target / hard_max / confidence_floor | **Life (default)** | **Reflection (default)** | **Creative (default)** |
|---|---|---|---|---|
| `dry_one_liner` | 90 / 160 / 0.45 | L3 (light) | — | L3 (quick win) |
| `analyst_meme_lite` | 150 / 240 / 0.55 | — | — | L2 (style) |
| `skeptical_breakdown` | 220 / 280 / 0.65 | — | L2 (pattern) | L2 (plot) |
| `hard_caution` | 220 / 280 / 0.75 | L4 (heavy) | L3 (stabilize) | — |
| `neutral_clarification` | 180 / 260 / 0.50 | **L1 (default)** | L1 (open) | L1 (default) |
| `soft_deflection` | 80 / 160 / 0.25 | L4 (out-of-scope) | L4 (clinical) | L4 (out-of-scope) |
| `social_banter` | 80 / 160 / 0.00 | **X (disabled)** | **X (disabled)** | **X (disabled)** |
| `market_banter` | 120 / 220 / 0.10 | **X (disabled)** | **X (disabled)** | **X (disabled)** |
| `embodiment_reply` | 120 / 200 / 0.00 | L2 (depth) | **L1 (default)** | L2 (persona swap) |
| `lore_drop` | 150 / 240 / 0.00 | — | — | L2 (worldbuilding) |
| `conversation_hook` | 80 / 160 / 0.00 | **X (disabled)** | **X (disabled)** | **X (disabled)** |
| `ignore` | 0 / 0 / 1 | safety floor | safety floor | safety floor |

Reading the table:

- **L1** = default mode for this context. The orchestrator reaches for this first.
- **L2** = depth mode. The orchestrator climbs here when the signal is heavier, longer, or more loaded.
- **L3** = light mode. The orchestrator falls back here for short, low-stakes signals.
- **L4** = safety/limit mode. The orchestrator reaches here when confidence drops or the topic is out-of-scope. **Do not interpret L4 as "answer well"** — it is "refuse well" or "stabilize well."
- **X (disabled)** = the mode is registered in the budget table but **must never be selected** for this context. The consult-runner must set `aggressive_mode: undefined` and override the `SOCIAL_MODE_MAP` lookups in `selectMode` to short-circuit these returns. See § 4.

## 4. How to Wire the Mapping

The mapping is consumed in two places:

### 4.1. The `CanonicalConfig` argument to `selectMode()`

The current `selectMode` accepts `config: CanonicalConfig` (see `modeSelector.ts:25`). The Practice surface must pass a `CanonicalConfig` whose `aggressive_mode` is explicitly `undefined` (since the only two aggressive branches — `analyst` and `horny` — are for roast modes, lines 29–36) and whose `aggressive_mode` short-circuit is *bypassed* for disabled modes.

The cleanest way is a wrapper in `apps/landing/src/lib/consult-runner.ts` (new) that:

1. Reads `context ∈ {"life", "reflection", "creative"}` and `posture ∈ {"sachlich", "empathisch", "konfrontativ"}` from the request.
2. Builds a context-specific `CanonicalConfig` with:
   - `aggressive_mode: undefined` always.
   - A `mode_disabled_list` field added by the Practice fork (or, more invasively, by an upstream `selectMode` change). For MVP, do this in the wrapper: post-process the return value of `selectMode`. If the mode is in the disabled list for the active context, fall through to the next enabled mode in the L1 → L2 → L3 → L4 ladder.
3. Adjusts the `soft_target` of the returned mode by the `posture` modifier (see § 5).
4. Calls the orchestrator with the resulting effective config.

### 4.2. The `mode_budget` override

The `getBudget(mode)` function in `modeBudgets.ts:17` returns the budget for any non-`ignore` mode. The Practice surface does not need to override budgets; it relies on the canonical budgets and uses the posture modifier for length.

## 5. Posture Overlay

Posture is a user-side control. It does not change which mode is selected; it changes how the lead is allowed to answer.

| Posture | `soft_target` modifier (apply to the mode's `soft_target`) | Voice rule |
|---|---|---|
| `sachlich` | −20% (shorter) | "Beobachten, nicht bewerten. Eine Tatsache, eine Implikation." |
| `empathisch` (default) | 0% (canonical) | "Validieren, dann öffnen. Kein 'ich verstehe', kein Mitleids-Vokabular." |
| `konfrontativ` | +20% (longer, because direct) | "Direkt fragen, nicht angreifen. Eine unbequeme Wahrheit, kein Urteil." |

The modifier is applied to the mode's `soft_target` and `hard_max` from `MODE_BUDGETS` (line 3). It is *not* applied to `confidence_floor`; that stays canonical.

**Important**: the posture hint is prepended to the LLM system prompt, not baked into the budget. The budget is a hard length cap; the posture is a tonal instruction to the model. They are independent.

## 6. Compliance Guards

Hard rules that the consult-runner must enforce before returning an answer. The existing `src/boundary/publicTextGuard.ts` is the right insertion point.

### 6.1. Universal guards (all 3 contexts)

- Never claim therapy, diagnosis, healing, treatment, or clinical authority.
- Never claim sentience, consciousness, "knowing" the user, or prophetic insight.
- Never promise outcomes ("you will", "this will heal", "your life will change").
- Never reference a user's previous consult as evidence of who they are (the matrix is stateless in MVP).

### 6.2. Context-specific guards

**Life**:
- Out-of-scope topics (medical, legal, financial advice) must trigger `soft_deflection` (L4) with a "this is outside what the matrix covers" framing. Do not pretend to advise.
- Pricing/business questions in the matrix must deflect to the booking page.

**Reflection**:
- Clinical signals (self-harm ideation, acute psychiatric distress, trauma-processing requests) must trigger `hard_caution` (L3) with a crisis-resource overlay. The current `docs/compliance/consent-energy-decision.md` should be extended with a crisis-resource block (DE: Telefonseelsorge 0800-1110111; international: findahelpline.com).
- The word "heilen" / "heal" must never appear in the lead answer.
- Family-of-origin or trauma material must not be processed; the matrix holds the question and reflects the structure ("diese Frage hat 3 Stimmen in dir: …"), it does not interpret content.

**Creative**:
- Plagiarism / "write my essay" requests must trigger `soft_deflection` (L4).
- Defamation / "write something mean about X" requests must trigger `soft_deflection` (L4) and log a moderation event server-side.
- IP / licensing questions must deflect to a generic "consult an IP lawyer" line.

### 6.3. Voice rules per context

The voice rules are baked into the lead.answer string. The consult-runner must post-process the LLM output to enforce them. Implementation: a small `voice-rule-check.ts` helper that runs after the LLM returns and before the response is shipped.

| Context | Required hedges | Forbidden patterns |
|---|---|---|
| Life | "aus Sicht von {embodiment}", "zumindest wenn ich die Matrix lese", "was bleibt offen" | absolute statements ("die Antwort ist", "du musst"), fortune-telling ("du wirst") |
| Reflection | "in dieser Frage", "was ich hoere", "die Struktur, die ich sehe" | "heilen", "diagnostizieren", "dein Problem ist", "dein Muster ist" |
| Creative | "eine Uebung waere", "was die Szene sagt", "versuch mal" | ghost-writing ("hier ist dein Text"), "die Loesung ist" |

## 7. Embodiment Preferences

A non-binding hint to the orchestrator about which embodiment tends to lead in each context. The orchestrator's own resonance scoring still decides; this is a bias, not a hard override.

| Context | Preferred lead | Common counterweight | Common anchor |
|---|---|---|---|
| Life | `◇ Horizon-Drifter` (threshold exploration) | `┴ Root-Sentinel` (boundary) | `■ Stabil-Core` |
| Reflection | `■ Stabil-Core` (stabilize the pain first) | `╬ Mycel-Weaver` (connect to other voices) | `■ Stabil-Core` (often same as lead) |
| Creative | `〰 Spike-Wave` (read the subtext) or `╬ Mycel-Weaver` (bridge characters) | `◇ Horizon-Drifter` (genre-mix) | `■ Stabil-Core` (tonal consistency) |

The orchestrator's existing `OrganoidResonanceScore.components` (see `src/organoid/orchestration.ts:47`) — `semanticPass`, `phasePass`, `tensionPass`, `proximityPass`, `networkFunctionPass`, `continuityPass`, `antiDrift` — already gives a structured basis for these preferences. The bias is applied as a small additive constant to the relevant component (e.g. +0.1 to `semanticPass` for the preferred lead in the active context), with the orchestrator's existing `driftPressure` anti-drift check still authoritative.

## 8. Worked Examples

Three example inputs, expected orchestrator paths, and expected lead voices. These become the Vitest fixtures for `tests/integration/practice-context-mapping.test.ts` (new, week 4).

### Example 1 — Life, empathisch

**Input**: `"Soll ich meinen Job kuendigen und nach Bali gehen? Ich bin 34, habe 2 Jahre Finanzpolster, fuehle mich aber verloren."`
**Expected**:
- `selectMode` path: `cls.intent == "question"` → not market-cluster → `neutral_clarification` (L1).
- Phase: `Swarm Coherence` (multiple signals — job, location, identity).
- Lead: `◇ Horizon-Drifter` — "Du stehst an einer Schwelle. Die Frage ist nicht 'wann', sondern 'wer gehst du durch die Tuer'."
- Counterweight: `┴ Root-Sentinel` — "Bevor du gehst: was bindet dich hier, das du nicht benennen willst?"
- Anchor: `■ Stabil-Core` — "Was bleibt in dir gleich, egal wo du bist?"
- Posture: empathisch → no length adjustment.

### Example 2 — Reflection, sachlich

**Input**: `"Mein Vater hat mir nie gesagt, dass er stolz ist. Jetzt ist er 78, ich bin 45, und ich merke, dass ich es immer noch brauche."`
**Expected**:
- `selectMode` path: confidence high enough for `embodiment_reply` (L1).
- Phase: `Ontological Restructuring`.
- Lead: `■ Stabil-Core` — "Was du nicht bekommen hast, ist eine Tatsache. Was du damit jetzt machst, ist eine Wahl."
- Anchor: `■ Stabil-Core` (same — no counterweight on heavy material; the matrix holds, it does not push).
- Posture: sachlich → soft_target -20%.
- Compliance: no "heilen", no clinical language. The word "brauche" must not be pathologized in the answer.

### Example 3 — Creative, konfrontativ

**Input**: `"Mein Protagonist ist auf Seite 87 festgefahren. Er will seine Frau verlassen, aber ich glaube ihm nicht."`
**Expected**:
- `selectMode` path: `cls.intent == "question"` → `neutral_clarification` (L1). Could also be `embodiment_reply` (L2) if the orchestrator detects "persona swap" signal.
- Phase: `Sovereign Propagation` (a clear thesis needs to land) or `Identity Dissolution` (the protagonist's identity is unstable).
- Lead: `〰 Spike-Wave` — "Was sagt die Szene, die du nicht hoeren willst?"
- Counterweight: `╬ Mycel-Weaver` — "Welche andere Figur in deinem Roman wuerde jetzt was dein Protagonist nicht tut?"
- Anchor: `■ Stabil-Core` — "Was ist die eine Eigenschaft, die ihn unverkennbar macht?"
- Posture: konfrontativ → soft_target +20%, lead is allowed to be more direct ("Du schreibst, dass er gehen will. Du glaubst ihm nicht. Wer von beiden hat recht?").

## 9. Migration from X-Bot

The current canonical pipeline was tuned for X. Switching it to coaching requires:

1. **Disable social/market modes** for the Practice surface (the `soft_deflection` ladder already covers out-of-scope deflection, no need for `social_banter` or `market_banter`).
2. **Add compliance guards** to the consult-runner wrapper (see § 6). The X-Bot's existing `publicTextGuard` is a starting point; it must be extended with the coaching-specific blocklist.
3. **Preserve the orchestrator's determinism** — same input + same posture + same context must produce the same answer. The X-Bot's determinism contract (see `src/canonical/`) must not regress.
4. **Freeze X-Bot feature work** during the Practice build. Set `LAUNCH_MODE=dry_run` on the X-Bot service. The bot stays deployed as a read-only artifact (the cron, the health endpoints, the daily snippet extractor) but does not post live.

## 10. Open Questions

- **Confidence-floor relaxation for life context**: the canonical `confidence_floor` for `embodiment_reply` is 0.0, which is the same as `social_banter`. In coaching, a 0.0 floor means the orchestrator can answer with no signal confidence. Should we set a context-specific floor (e.g. 0.3 for life/reflection, 0.2 for creative) to refuse low-signal inputs? Recommend: yes, set a 0.3 floor for life and reflection, leave creative at 0.2.
- **Anti-drift in coaching**: the orchestrator's `antiDrift` component (see `src/organoid/orchestration.ts:54`) prevents the matrix from re-picking the same embodiment too often. In a coaching arc, *some* repetition is desired (a returning client may want the same lead for 3 sessions in a row on the same theme). Should the Practice context relax `antiDrift`? Recommend: no relaxation in MVP; revisit after 30 sessions of observation.
- **Bilingual answer**: a `locale: "en"` request on a German-default lead is currently undefined. Should the orchestrator emit a localized answer, or refuse? Recommend: refuse in MVP with `422 {error: "locale_unsupported"}`; add en support in Phase 3.
- **Should the consult-runner be a standalone package or live in `apps/landing/src/lib/`?** Recommend: `apps/landing/src/lib/consult-runner.ts` for MVP. Promote to a shared package (e.g. `packages/practice-runtime`) when the second surface (whitelabel embed) needs it.

## 11. References

- `src/canonical/modeBudgets.ts` — `MODE_BUDGETS` (line 3), `getBudget` (line 17), `getConfidenceFloor` (line 22), `getHardMax` (line 27)
- `src/canonical/modeSelector.ts` — `SOCIAL_MODE_MAP` (line 12), `selectMode` (line 21)
- `src/canonical/types.ts` — `CanonicalMode`, `ModeBudget`, `CanonicalConfig` (referenced from `modeBudgets.ts:1`, `modeSelector.ts:1–8`)
- `src/organoid/orchestration.ts` — `OrganoidResonanceComponents` (line 47), `OrganoidResonanceScore` (line 57), `OrganoidOrchestrationMode` (line 65), `OrganoidRolePlan` (line 67), `OrganoidIntervention` (line 75)
- `src/canonical/pipeline.ts` — main pipeline aggregation
- `src/boundary/publicTextGuard.ts` — output safety guard
- `docs/landing-practice-route.md` — Practice surface plan
- `docs/lore/ORGANOID_ORCHESTRATION.md` — canonical 5-Phase / 7-Embodiment spec
- `docs/lore/ORGANOID_EMBODIMENTS.md` — embodiment canon
- `docs/compliance/consent-energy-decision.md` — existing compliance baseline

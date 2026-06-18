# Practice Route Plan — `/practice` + `/consult`

Status: planning artifact, not implemented. This document bridges the existing `$wetware` landing surface to a future coaching-practice surface on the same domain.

## 1. Scope

The current `apps/landing/` is a single-page **`$wetware` token surface** — bio-digital artifact, meme-native, X-community oriented. It speaks a third-person artifact voice ("$wetware is a signal surface"). It is not a practice.

The Practice surface is a **second brand layer** under the same domain, in a **first-person human voice**, that markets and operates a 1:1 + group coaching practice grounded in the 5-Phase / 7-Embodiment methodology.

The Practice surface:

- Reuses the existing component library (`signal-card`, `archetype-grid`, `reveal`, `section-heading`, `theme`, `semantic-bridge`).
- Reuses the existing tone palette (`bio` / `interface` / `meme` / `anchor` / `neutral`).
- Adds new components for booking, embodiment explorer, consult input, and answer display.
- Reuses the canonical pipeline (`src/canonical/`) and the organoid orchestrator (`src/organoid/orchestration.ts`) for the actual consult logic.
- Does **not** call X / Twitter APIs, does **not** poll, does **not** run the worker loop. The Practice surface is read-and-respond only, with a server-side consult endpoint.

Coexistence: `/` stays the `$wetware` surface (unchanged). `/practice/*` and `/consult` are new routes under the same Next.js app. Same `pnpm build:landing` pipeline, same Render service (`organoid-landing`).

## 2. Routes

### MVP (week 1–4)

| Route | Type | Purpose |
|---|---|---|
| `/` | existing | `$wetware` token surface (unchanged) |
| `/practice` | new, server-rendered | Practice landing: bio, methodology summary, 7-embodiment grid, session types, group CTA, booking entry |
| `/practice/embodiments/[id]` | new, static | Per-embodiment page: glyph, name, classical function, coaching function, sample quote, "use me when…" |
| `/consult` | new, client-interactive | Single-page consult: input textarea + context selector + posture selector + answer card |
| `/api/consult` | new, POST | Server-side consult endpoint. Wraps the canonical pipeline. Returns structured answer JSON. |
| `/api/health` | new, GET | Liveness for the consult endpoint (separate from worker `/health`) |

### Phase 2 (week 5–8)

| Route | Type | Purpose |
|---|---|---|
| `/consult/history` | client | LocalStorage-backed history viewer. Pro-tier: server-backed. |
| `/practice/sessions` | new | Cal.com embed (or custom) for 1:1 booking |
| `/practice/groups` | new | Group-program detail + cohort sign-up |
| `/api/booking/webhook` | new | Cal.com → server confirmation, optional email send |
| `/api/auth/magic` | new | Email magic-link for Pro tier (Resend or Postmark) |

### Phase 3 (month 3+)

| Route | Type | Purpose |
|---|---|---|
| `/consult/cohort/[id]` | gated | Cohort-only daily-pull + weekly embodiment focus |
| `/practice/methodology.pdf` | static | Whitepaper export |
| `/api/embed/[token]` | new | Whitelabel embed for partner coaches |

## 3. Page Structure — `/practice`

Sections in order. Each section is a server component; interactivity only inside `consult` form and embodiment detail cards.

| # | Section | Reuse | Notes |
|---|---|---|---|
| 1 | SiteHeader | existing `site-header.tsx`, modified | Add nav link "Practice" → `/practice`; rename "Token" → "Surface" to disambiguate from `/` |
| 2 | Hero | new `practice-hero.tsx` | First-person voice. Name, headline ("Liminal work. 7 voices. 5 movements."), short bio paragraph, primary CTA "Book a session", secondary CTA "Try the matrix free" |
| 3 | Methodology | new `practice-methodology.tsx` | The 5-Phase loop rendered as a horizontal stepper. Each phase is a card: name, function, what happens in a session, sample question. Reuse `signal-card` for the cards. |
| 4 | Embodiments | new `practice-embodiment-grid.tsx` | 7 cards in a grid (3 + 4 layout, or single column mobile). Each shows glyph, name, classical function, coaching function, "→ /practice/embodiments/[id]". Reuse `archetype-grid` styling. |
| 5 | Session Types | new `practice-session-types.tsx` | 3 cards: 1:1 Deep, 1:1 Burst, Group Cohort. Price, duration, frequency, what to expect. Reuse `signal-card`. |
| 6 | Group Cohort | new `practice-cohort-cta.tsx` | Current cohort status (open / closed), next start date, "7 weeks · 7 voices", sign-up CTA. |
| 7 | Compliance | new `practice-compliance.tsx` | Clear "Reflection companion, not therapy. No diagnosis. No clinical claims." Disclaimer block, low-key visual, link to full scope-of-practice page (Phase 3). |
| 8 | Footer | existing `footer-manifest.tsx`, modified | Add: scope-of-practice link, contact email, Cal.com handle, group-cohort FAQ. |

## 4. Page Structure — `/consult`

Single client component. State is local React state for MVP; LocalStorage for history (Phase 2).

| Block | Component | Notes |
|---|---|---|
| Header | `consult-header.tsx` | Small, no nav. Logo + "Back to practice" link |
| Context Selector | `consult-context-selector.tsx` | 3 radio cards: "Life" / "Reflection" / "Creative". Each card shows 1-line description. Default = "Life". |
| Posture Selector | `consult-posture-selector.tsx` | 3 radio chips: "Sachlich" / "Empathisch" / "Konfrontativ". Default = "Empathisch". |
| Textarea | `consult-input.tsx` | Placeholder rotates per context. Max 800 chars (lite) / 4000 (pro). Show counter. |
| Submit | inline button | "Aus der Matrix ziehen". Loading state shows the 7-glyph sequence animation (re-use `reveal.tsx` pattern). |
| Answer Card | `consult-answer.tsx` | Big glyph + name, phase tag, 2–4 sentences lead text, optional counterweight + anchor toggles, "Andere Stimme zeigen" button |
| History | `consult-history.tsx` (Phase 2) | LocalStorage list, click to re-load. Each entry shows: date, context, lead glyph |

## 5. Components — New vs Reused

### New (build in week 1–2)

- `apps/landing/src/components/practice-hero.tsx`
- `apps/landing/src/components/practice-methodology.tsx`
- `apps/landing/src/components/practice-embodiment-grid.tsx`
- `apps/landing/src/components/practice-session-types.tsx`
- `apps/landing/src/components/practice-cohort-cta.tsx`
- `apps/landing/src/components/practice-compliance.tsx`
- `apps/landing/src/app/practice/page.tsx`
- `apps/landing/src/app/practice/embodiments/[id]/page.tsx`
- `apps/landing/src/app/consult/page.tsx`
- `apps/landing/src/app/api/consult/route.ts`
- `apps/landing/src/app/api/health/route.ts`
- `apps/landing/src/components/consult-header.tsx`
- `apps/landing/src/components/consult-context-selector.tsx`
- `apps/landing/src/components/consult-posture-selector.tsx`
- `apps/landing/src/components/consult-input.tsx`
- `apps/landing/src/components/consult-answer.tsx`

### Reused as-is

- `apps/landing/src/components/signal-card.tsx` (for session types, methodology steps)
- `apps/landing/src/components/section-heading.tsx` (for section headers)
- `apps/landing/src/components/reveal.tsx` (for scroll-trigger animations)
- `apps/landing/src/components/archetype-grid.tsx` (visual reference for the new embodiment grid)
- `apps/landing/src/lib/theme.ts` (tone palette: bio / interface / meme / anchor / neutral)
- `apps/landing/src/lib/utils.ts` (cn helper, type guards)

### Reused with modification

- `apps/landing/src/components/site-header.tsx` — add Practice link, disambiguate Token vs Surface
- `apps/landing/src/components/footer-manifest.tsx` — add practice surface links
- `apps/landing/src/lib/content.ts` — add `practice` namespace alongside the existing `content` object

## 6. State & Persistence

### MVP (no auth)

- Browser `localStorage` key `practice:consult:history` for the last 30 consults. JSON array of `{timestamp, context, posture, leadId, requestId}`.
- No server-side history. The server logs only `requestId` (UUID), `context`, `leadId`, latency, and status code, never the prompt text.
- Cookie `practice:context:default` for the last-used context selector. Pure UX convenience.

### Phase 2 (Pro tier, magic-link auth)

- New table `consult_users` (Postgres) with `id`, `email`, `created_at`, `tier`.
- New table `consult_history` (Postgres) with `user_id`, `request_id`, `context`, `posture`, `lead_id`, `phase_id`, `signal_hash` (SHA-256 of the prompt), `answer_text`, `created_at`.
- The signal text itself is **not** stored by default. Only its hash for dedup. Pro-tier users can opt in to "save signal text" via explicit toggle.
- LLM provider: signal text is sent to xAI / OpenAI. The Practice endpoint must use a system prompt that explicitly states "this is a reflection prompt, not a therapy or clinical request" and must pass through `publicTextGuard` before returning.

## 7. API — `/api/consult`

### Request

```json
POST /api/consult
Content-Type: application/json
{
  "signal": "Soll ich meinen Job kündigen und nach Bali gehen?",
  "context": "life",
  "posture": "empathisch",
  "locale": "de"
}
```

`context` ∈ `"life" | "reflection" | "creative"`.
`posture` ∈ `"sachlich" | "empathisch" | "konfrontativ"`. Default: `"empathisch"`.
`signal` max 4000 chars.
`locale` ∈ `"de" | "en"`. Default: `"de"`.

### Response

```json
200 OK
{
  "requestId": "01HXY9Z...ULID",
  "phase": "Swarm Coherence",
  "phaseConfidence": 0.78,
  "lead": {
    "id": "horizon-drifter",
    "glyph": "◇",
    "name": "Horizon-Drifter",
    "classical": "Nebelspieler",
    "answer": "Du stehst an einer Schwelle. Die Frage ist nicht wann. Die Frage ist als wer."
  },
  "counterweight": {
    "id": "root-sentinel",
    "glyph": "┴",
    "name": "Root-Sentinel",
    "classical": "Wurzelwaechter",
    "answer": "Bevor du gehst: was bindet dich hier, das du nicht benennen willst?",
    "blockedReason": "Boundary ist nicht die Fuehrungs-Stimme in dieser Frage, aber sie fehlt, wenn man sie ueberhoert."
  },
  "anchor": {
    "id": "stabil-core",
    "glyph": "■",
    "name": "Stabil-Core",
    "classical": "Stillhalter",
    "answer": "Was bleibt in dir gleich, egal wo du bist?"
  },
  "echo": null,
  "suppressor": null,
  "validation": {
    "passed": true,
    "mode": "embodiment_reply",
    "budgetChars": 200,
    "actualChars": 167
  },
  "evidence": {
    "signalHash": "sha256:7c4a8d...",
    "seed": "2026-06-16T12:34:56.000Z",
    "modelVersion": "grok-3"
  }
}
```

### Failure modes

| Code | Body | Meaning |
|---|---|---|
| 400 | `{error: "signal_too_long", maxChars: 4000}` | Input exceeds limit |
| 400 | `{error: "invalid_context"}` | `context` not in allowed set |
| 422 | `{error: "validation_failed", reasons: ["low_confidence", "clinical_topic"]}` | Pipeline refused (e.g. confidence below floor, or clinical-topic guard tripped) |
| 429 | `{error: "rate_limited", retryAfter: 60}` | Per-IP rate limit (10/min lite, 60/min pro) |
| 500 | `{error: "internal", requestId}` | Pipeline error; never leak internals |

### Server-side flow

```
POST /api/consult
  → rate-limit check (per IP, lite or pro key)
  → input validation (zod schema, length, locale)
  → clinical-topic guard (simple blocklist + LLM-side guard)
  → context → mode-budget map (see methodology/coaching-contexts.md)
  → posture → tone-hint prepend
  → call src/canonical/pipeline.ts + src/organoid/orchestration.ts
     with config: { mode, posture, context, locale, sessionId }
  → assemble structured answer JSON
  → publicTextGuard pass on lead.answer + counterweight.answer
  → return JSON
```

The server-side wrapper lives in `apps/landing/src/lib/consult-runner.ts` (new). It re-exports the pipeline entrypoint and adapts the canonical config to a `CanonicalConfig` shape that `selectMode()` and `getBudget()` understand. See `docs/methodology/coaching-contexts.md` for the exact mapping.

## 8. Copy Principles

Voice: first person, present tense, low ceremony. No "we" — only "I" + the matrix. No esotericism, no cosmic promises. No "I will help you unlock your potential" — that's a therapy-claim pattern. Use the existing 7-embodiment vocabulary consistently; the embodiments are the brand.

Examples of acceptable copy:

- "Ich arbeite mit 7 Stimmen, die in mir sprechen. Die Matrix hilft mir, sie zu sortieren, bevor sie laut werden."
- "Eine Frage. Eine Antwort aus der Fuehrungs-Stimme. Optional die Gegenstimme und den Anker."
- "Reflection companion, kein Therapeut. Wenn du klinische Themen mitbringst, verweise ich an Fachpersonen."

Examples of unacceptable copy (do not ship):

- "Unlock your inner archetypes" → therapy-claim pattern
- "Heal your shadow" → clinical claim
- "The matrix knows your truth" → false certainty
- "I will transform your life" → outcome promise

The `publicTextGuard` in `src/boundary/publicTextGuard.ts` should be extended with a coaching-specific blocklist. See `docs/methodology/coaching-contexts.md § Compliance`.

## 9. Integrations

| Integration | Status | Notes |
|---|---|---|
| Cal.com | Phase 2 | Self-hosted or cloud. Embed via iframe or `@calcom/embed-react`. Session types: 60-min Deep, 60-min Burst, 90-min Group. |
| Resend (or Postmark) | Phase 2 | Magic-link auth, session confirmation, cohort reminder. |
| Stripe | Phase 3 | Subscription for Pro tier (19€/month) and group cohort sign-up (350€/cohort). |
| xAI (or OpenAI) | Phase 1 | LLM provider. Configured in `apps/landing/.env.local` (xAI) and `render.yaml` (Pro tier). |
| Sentry | Phase 2 | Error tracking on `/api/consult`. PII-safe: never log the signal text, only `signalHash` and `requestId`. |

## 10. Build Order

| Week | Deliverable | Validation |
|---|---|---|
| 1 | `/practice` static page with hero, methodology, embodiment grid, compliance | `pnpm --filter landing build` passes; visual review against brand tone |
| 2 | `/practice/embodiments/[id]` static pages for all 7 embodiments (1 page per id, generated from a small JSON manifest) | All 7 routes return 200; no broken glyphs |
| 3 | `/api/consult` endpoint + `/consult` page with input + answer display (no history yet) | `curl POST /api/consult` returns structured JSON; Vitest snapshot of response shape |
| 4 | Mode/context/posture mapping wired; clinical-topic guard; rate-limit; E2E test | Vitest covers all 3 contexts × 3 postures (9 cases) |
| 5 | LocalStorage history; magic-link auth; Pro tier toggle | Auth round-trip works; Pro user sees history |
| 6 | Cal.com embed on `/practice/sessions`; cohort CTA on `/practice/groups` | Cal.com embed renders; cohort status correctly gated |
| 7 | Compliance review; copy review; Sentry; rate-limit tuning | `pnpm run ci` green; manual copy review sign-off |
| 8 | Soft launch to 5 pilot clients; first 30 sessions observed; iteration on prompt-construction | 30 sessions documented; 1 cohort scheduled |

## 11. Open Questions

- **Subdomain split**: do we run the practice on a subdomain (`practice.matrix.dev`) or a subpath (`/practice`)? Subdomain is cleaner brand-separation; subpath is cheaper (no DNS, no extra Render service). Recommend: subpath for MVP, subdomain after Pro tier takes off.
- **Multi-language**: copy is German-first. English version in Phase 3? Both `de` and `en` already in the API spec.
- **Mobile-first**: components are responsive (Tailwind grid), but the consult form on mobile is the make-or-break UX. Need explicit mobile testing in week 4.
- **Accessibility**: the glyph-heavy visual language needs `aria-label` on every glyph. The 7-glyph loading animation must be screen-reader-friendly (use `aria-live="polite"` + text alternative).
- **What to do with the X-Bot during this build**: see `docs/methodology/coaching-contexts.md § Migration from X-Bot`. Recommendation: set `LAUNCH_MODE=dry_run` and freeze feature work on the bot for the duration of the Practice build.

## 12. References

- `src/canonical/modeBudgets.ts` — 11 canonical modes and their budgets
- `src/canonical/modeSelector.ts` — `selectMode()` entrypoint
- `src/organoid/orchestration.ts` — phase / resonance / role-plan engine
- `docs/methodology/coaching-contexts.md` — context → mode mapping, voice rules, compliance
- `docs/lore/ORGANOID_ORCHESTRATION.md` — canonical 5-Phase / 7-Embodiment spec
- `mementic_circus/README.md` — pillar frontdoor

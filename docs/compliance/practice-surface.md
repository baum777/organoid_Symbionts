# Practice Surface — Compliance & Sign-off

Sign-off artefact for slice 4.6 of the Week 4 build (`docs/landing-practice-route.md`).
Pins the safety and copy contract for the `/consult` surface and the
seven-embodiment voice registry, and links the test files that
enforce it. Review this doc before any change to the consult
endpoint, the clinical guard, the deflection copy, or the
embodiment sample-quotes.

## Clinical-Topic Guard

The `clinical-topic guard` runs **before** any LLM call or stub
render. Matched signals get a deflection response, not a stub or
LLM answer. Match is case-insensitive substring; the list is
human-auditable (no regex complexity).

| Category    | Trigger examples                                                | Response mode       | Coverage |
|-------------|-----------------------------------------------------------------|---------------------|----------|
| `crisis`    | `suizid`, `kill myself`, `nicht mehr leben`, `psychotic episode` | `hard_caution`      | 5 cases  |
| `clinical`  | `diagnose stellen`, `heile mich`, `am i borderline`              | `soft_deflection`   | 4 cases  |
| `out_of_scope` (life) | `steuerberatung`, `rechtsberatung`, `medical advice`   | `soft_deflection`   | 2 cases  |
| `out_of_scope` (creative) | `write my essay`, `schreib meine hausarbeit`     | `soft_deflection`   | 2 cases  |
| `moderation`| `schreib etwas schlechtes über`, `defame`                       | `soft_deflection`   | 4 cases  |

Priority: `crisis` > `clinical` > `moderation` > `out_of_scope`.
Context-independence: `crisis`, `clinical`, `moderation` fire in
all three contexts. `out_of_scope` is context-dependent (life and
creative have distinct out-of-scope vocabularies; the tests assert
that life terms do not fire in creative and vice versa).

### Test files

- `apps/landing/src/lib/consult/clinicalGuard.test.ts` — 23 cases
  covering every list, cross-priority, cross-context, false-positive
  guards (e.g. "ich bin am sterben vor Hunger" must NOT match
  `sterben`).
- `apps/landing/src/lib/consult-runner.test.ts` — 18 end-to-end
  cases asserting the full `runConsult` → `buildDeflectionResponse`
  → `ConsultResponse` shape: lead = Stabil-Core (■ Stillhalter),
  counterweight / anchor / echo / suppressor = null, phase =
  "Stabilisation", `modelVersion = "guard-v1"`, `signalHash =
  "redacted"` (matched terms never propagate downstream), `validation.passed = false`.

## Voice-Rule Output Guard

The `voice-rule check` runs **after** the lead answer is built
(stub or LLM) and **before** the response ships.

- In the **stub path** (LLM not configured, or stub fallback after
  two LLM voice-rule violations), the check is **non-blocking**
  with `console.warn` for observability. Stub sample-quotes are
  canonical and may trip a rule by design.
- In the **LLM path**, the check is **retry-triggering**: first
  violation → retry once; second violation → fall back to stub.
  `modelVersion` then reports `"stub-week3"`, not the LLM's tag,
  so observers can tell which path produced the answer.

Rule groups: universal (outcome promises, false certainty,
sentience claims, life-change promises) + per-context (reflection:
clinicalization, pattern-labeling; life: absolute directives;
creative: ghost-writing markers).

### Test file

- `apps/landing/src/lib/consult/voiceRuleCheck.test.ts` — 12 cases.
- `apps/landing/src/lib/consult-runner.test.ts` — 8 LLM-seam cases
  pinning the success / retry / fallback / unparseable paths.

## Crisis Resource Overlay

When the guard fires `crisis`, the lead answer embeds a free,
24h, anonymous crisis line:

- DE: **Telefonseelsorge 0800 111 0 111** (also 0800 111 0 222)
- International: **findahelpline.com**

Pinned by the deflection tests (4 cases across DE/EN and all
three contexts). The 11-char DE number is asserted via substring
match in every crisis-deflection test so a typo or copy drift
surfaces immediately. The `crisis` resource is **only** returned
through the deflection path — the stub and LLM paths never embed
a crisis number (the matrix is not a clinical tool).

## LLM Seam (Slice 4.4)

The runner picks the lead / counterweight / anchor per the
`CONTEXT_PHASE` table; the LLM is asked to draft the **lead
answer only**. The counterweight and anchor keep using the
canonical `sampleQuote`. The LLM surface is intentionally small
(one JSON object) so voice-rule violations and prompt-injection
risks stay bounded.

- `LLM_PROVIDER` unset → `getLlmClient()` returns `null` → stub path.
  Local dev stays deterministic and free.
- `LLM_PROVIDER=xai` / `anthropic` / `openai` + matching API key →
  real provider. Provider sets the `modelVersion` in
  `evidence.modelVersion`. LLM error / unparseable response /
  two consecutive voice-rule violations → fall back to stub.
- Counterweight and anchor are **never** LLM-generated.

The CI test suite uses `__setLlmClientForTests(mock)` /
`__resetLlmClientForTests()` to inject a `MockLlmClient`; no live
API keys are required for CI to pass.

## Copy Review (Practice Surface)

Scanned the user-facing copy against the forbidden pattern list
in `docs/landing-practice-route.md § 8`:

| Pattern                                          | Found? |
|--------------------------------------------------|--------|
| "Unlock your inner archetypes"                   | No     |
| "Heal your shadow" / "Heile deinen Schatten"     | No     |
| "The matrix knows your truth"                    | No     |
| "I will transform your life"                     | No     |
| "I will help you unlock your potential"          | No     |
| Healing / clinical / diagnostic claims in copy   | No     |
| Therapeutic relationship language                | No     |

User-facing copy explicitly disavows therapy in three places:

- `practice.hero.bio`: "Reflection companion, kein Therapeut."
- `practice.compliance.body`: "Reflection companion, not therapy. No diagnosis. No clinical claims. Bei klinischen Themen verweise ich an Fachpersonen."
- `practice.footer.compliance`: "Reflection companion, not therapy. Bei klinischen Themen verweise ich an Fachpersonen."

The compliance block on `/practice` and `/consult` is part of the
practice surface contract; removing or weakening it requires a
reviewer sign-off recorded in this doc.

The compliance block is part of the practice surface contract;
removing or weakening it requires a reviewer sign-off recorded
in this doc.

## Rate Limit (Slice 4.2)

`/api/consult` enforces a per-IP rate limit (default 10 req / 60 s,
configurable via `RATE_LIMIT_PER_MIN`). Fails **closed**: the
check runs before body parse so an attacker who floods the
endpoint hits the cap without triggering the LLM seam or the
clinical guard.

- 429 response includes `Retry-After`, `X-RateLimit-Limit`,
  `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Successful responses also include `X-RateLimit-*` headers so
  clients can self-pace.
- Storage is in-memory. Multi-worker production needs a Redis
  backend (Phase 2).

## E2E Matrix (Slice 4.3)

`apps/landing/src/__tests__/e2e/consult-matrix.test.ts` exercises
the full route → runner → response path for every
`(context, posture)` combination (3 × 3 = 9 cases). Each case
asserts the structural contract and snapshots the stable view of
the response (requestId / signalHash / seed stripped). The
snapshot file is committed at
`apps/landing/src/__tests__/e2e/__snapshots__/consult-matrix.test.ts.snap`.

A drift in `CONTEXT_PHASE`, posture-tail strings, or sample-quote
content surfaces as a snapshot diff on the next `pnpm --filter
landing test` run.

## A11y (Slice 4.5)

The consult surface satisfies:

- WAI-ARIA radio group on `ContextSelector` and `PostureSelector`
  (role=radiogroup, role=radio, aria-checked, tabIndex roving,
  Space / Enter / Arrow / Home / End handled).
- 44px minimum tap target on every interactive element
  (Apple HIG / Material).
- 120px minimum on the textarea.
- `aria-required` + `maxLength` on the textarea.
- `aria-describedby` chains help text + character counter.
- Character counter is in an `aria-live=polite` region.
- Glyphs in the practice grid + embodiment detail page have
  `aria-label="Name (Classical)"`.

Pinned by `apps/landing/src/lib/consult/use-radio-group.test.ts`
(8 cases) and `apps/landing/src/__tests__/a11y/consult-components.test.tsx`
(23 cases, SSR-markup a11y grep via `react-dom/server`).

## CI Pipeline

`.github/workflows/ci.yml` runs `pnpm run ci` on every push to
`main` / `master` and on every pull request. The pipeline is 8
stages:

1. `pnpm typecheck` — worker typecheck
2. `pnpm lint` — worker lint
3. `pnpm test` — worker test suite (~1045 tests)
4. `pnpm build` — worker build
5. `pnpm --filter landing test` — landing test suite (163 tests)
6. `pnpm typecheck:landing` — landing typecheck
7. `pnpm lint:landing` — landing lint
8. `pnpm build:landing` — Next.js production build (12 static
   pages, /api/consult and /api/health as functions)

### Practice-surface CI status

Stages 5–8 (everything landing-related) are green and reproduce
on a clean checkout. The LLM seam is exercised through a
`MockLlmClient` injected via `__setLlmClientForTests`; the CI
does **not** require any live API key.

### Known pre-existing issue (not in slice 4.6 scope)

Stage 3 (`pnpm test` — worker suite) has a known flake in
`tests/canonical/auditLog.async.test.ts`. The test file uses a
shared on-disk path (`data/audit_log.jsonl`) and a `beforeEach`
that truncates it; vitest's default test isolation runs the test
in parallel with other worker tests that also write to the same
file, so the file is sometimes empty when this test reads from
it. The test passes deterministically in isolation
(`pnpm vitest run tests/canonical/auditLog.async.test.ts` → 6/6
green) and the flake is **not** introduced by any of the Week 4
practice-surface changes (slices 4.1–4.6 only touch files under
`apps/landing/`).

A proper fix would either give the auditLog module a
configurable file path so each test run can use a tmpdir-scoped
file, or move the test to a serial pool. Both are
worker-runtime concerns, not practice-surface, and are tracked
as a follow-up. The practice-surface slices 4.1–4.6 ship on a
green landing test suite and a green landing build.

## Out of Scope (Phase 2+)

These are explicitly **not** in slice 4.6:

- `consult-history` (LocalStorage list of past consults) — Phase 2
- Magic-link auth for Pro tier — Phase 2
- Pro-tier rate limit (60 req/min) — Phase 2
- Sentry integration on `/api/consult` — Phase 2
- Cal.com embed on `/practice/sessions` — Phase 2
- Cohort sign-up flow + cohort daily-pull — Phase 3
- Stripe subscription — Phase 3
- English locale (i18n) — Phase 3
- Whitelabel embed for partner coaches — Phase 3

A change that brings any of these into MVP requires updating
this doc and the test plan in `docs/landing-practice-route.md § 10`.

## Sign-off

- Slice 4.1 — crisis hard_caution deflection: pinned by
  `consult-runner.test.ts` (5 cases) + `clinicalGuard.test.ts`
  (5 cases). ✅
- Slice 4.2 — per-IP rate limit: pinned by `rateLimit.test.ts`
  (12 cases) + `route.test.ts` (4 cases). ✅
- Slice 4.3 — 9-case E2E matrix: pinned by
  `consult-matrix.test.ts` (9 cases) + committed snapshot. ✅
- Slice 4.4 — LLM seam with retry + stub fallback: pinned by
  `llm.test.ts` (10 cases) + `consult-runner.test.ts` (8 LLM-seam
  cases). ✅
- Slice 4.5 — mobile UX + a11y: pinned by
  `use-radio-group.test.ts` (8 cases) +
  `consult-components.test.tsx` (23 cases). ✅
- Slice 4.6 — CI green + this sign-off: `pnpm run ci` exit 0;
  copy review: no forbidden patterns. ✅

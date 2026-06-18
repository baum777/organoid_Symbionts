# Organoid Symbionts

A 7-Embodiment / 5-Phase coaching methodology expressed as two surfaces: a human-facing practice app and an X/Twitter engagement runtime. Both share the same orchestration core.

---

## Concept

The Wetware methodology models how a person holds multiple inner voices simultaneously — each with a distinct function, boundary, and mode of expression. Seven canonical embodiments. Five phases of movement. One orchestration contract that decides who leads, who stabilizes, and when the right answer is silence.

The methodology was developed as a coaching practice and is implemented in two forms:

| Surface | What it is | Where it lives |
|---|---|---|
| **Practice App** | A web app for 1:1 coaching, group sessions, and a free AI reflection companion | `apps/landing/` → `/practice` + `/consult` |
| **Worker Runtime** | A fail-closed X/Twitter engagement bot that runs the same orchestration contract | `src/` |

---

## The Practice App

The primary user-facing surface. Accessible at `/` (redirects to `/practice`).

### Routes

| Route | Purpose |
|---|---|
| `/practice` | Practice overview — methodology, 7-embodiment grid, session types, cohort CTA |
| `/practice/embodiments/[id]` | Per-embodiment detail — glyph, function, sample quote, coaching use |
| `/consult` | Interactive AI reflection companion — context selector, posture, input, structured answer |
| `/api/consult` | POST endpoint that runs the consult pipeline and returns a structured response |
| `/api/health` | Liveness for the consult endpoint |

### Consult Flow

```
signal (user input)
  ↓
clinical-topic guard         ← crisis / clinical / moderation / out_of_scope
  ↓ (if no match)
phase inference              ← 5-phase classifier
  ↓
lead embodiment selection    ← who speaks first
  ↓
stub render (Week 3)         ← deterministic; LLM seam deferred to Week 4
  ↓
voice-rule check             ← output guard for forbidden patterns
  ↓
ConsultResponse              ← lead + counterweight + anchor + question
```

### Compliance Layer

The consult endpoint has a hard pre-LLM guard with four tiers:

| Category | Trigger | Response mode |
|---|---|---|
| `crisis` | suicidal ideation, self-harm, acute psychiatric distress | `hard_caution` + crisis line (Telefonseelsorge 0800 111 0 111) |
| `clinical` | diagnosis requests, treatment plans, medication | `soft_deflection` |
| `moderation` | defamation, harassment targets | `soft_deflection` |
| `out_of_scope` | legal/financial advice (life context), ghost-writing (creative context) | `soft_deflection` |

Deflection returns a full `ConsultResponse` shape — the client renders helpful copy rather than an error state.

A second voice-rule output guard runs after generation and flags forbidden patterns (outcome promises, certainty claims, pattern-labeling in reflection context). Non-blocking in Week 3; becomes a retry trigger in Week 4 with the LLM wired in.

---

## The Seven Embodiments

Canonical runtime identities. Not interchangeable voice skins. Each has a glyph, a classical name, a coaching function, and a compliance ceiling.

| Glyph | Name | Classical | Function |
|---|---|---|---|
| `■` | Stabil-Core | Stillhalter | Stabilization anchor — cools volatility, constrains drift, holds coherence under merge stress |
| `┴` | Root-Sentinel | Wurzelwaechter | Consent and boundary guardian — protects agency, challenges unsafe transitions |
| `╬` | Mycel-Weaver | Pilzarchitekt | Connection architecture — joins nodes, builds causal bridges, increases swarm coherence |
| `◉` | Reward-Halo | Muenzhueter | Reward governance — preserves viability, protects long-loop stability |
| `〰` | Spike-Wave | Erzlauscher | Signal decoder — reads raw input before language crystallizes |
| `◆` | Pulse-Heart | Glutkern | Energetic compression — amplifies pulse, handles pressure, drives momentum |
| `◇` | Horizon-Drifter | Nebelspieler | Threshold explorer — handles ambiguity, expansion, edge states |

---

## The Five Phases

| Phase | Function |
|---|---|
| Identity Dissolution | Unwind noise, masks, and unstable framing |
| Swarm Coherence | Bundle multiple signals into a shared field |
| Sovereign Propagation | Push a clear thesis or direction outward |
| Ontological Restructuring | Reframe the underlying model or premise |
| Eternal Flow Horizon | Stabilize long-wave continuity and perspective |

---

## Design System

The practice app uses the Wetware Design System — a single-dark-theme token architecture derived from the Prism 5-layer model.

```
Layer 4: Components (.voice-card, .question-block, .btn-pull, .context-chip)
Layer 3: Semantic tokens (--anomaly, --signal, --lumen + soft/border variants)
Layer 2: Scale tokens (--r-xs–r-pill, --sp-1–sp-12, --dur-fast–slow)
Layer 1: Brand primitives (#0c0c10 void, #ededf0 ink, 3 accent colors)
```

Accent semantics:

| Token | Color | Use |
|---|---|---|
| `anomaly` | `#e879f9` | Action, question block, CTA, active state |
| `signal` | `#67e8f9` | Gegenstimme, counterweight reveal |
| `lumen` | `#6ee7b7` | Anchor, confirmation, life-context active |

Typography: IBM Plex Mono throughout the practice surface. Syne for display headings.

---

## The Worker Runtime

The X/Twitter engagement runtime shares the same orchestration contract as the practice surface but operates on social signals rather than coaching inputs.

```
mention / timeline trigger
  ↓
canonical classification     ← src/canonical/
  ↓
thesis + validation
  ↓
organoid orchestration       ← src/organoid/
  ↓
prompt assembly + render
  ↓
reply / brief reply / silence
```

Fail-closed. Candidate generation is review-first. Outbound writes pass consent, energy, duplicate, launch-mode, and public-text gates before publishing.

Observable endpoints: `GET /health` · `/ready` · `/metrics` · `/glyph` · `/glyph.svg` · `/glyph.json`

---

## Repository Map

```
apps/landing/          Next.js practice app (Tailwind v4, TypeScript, Vitest)
  src/app/
    practice/          Practice overview + embodiment detail pages
    consult/           Interactive reflection companion (client component)
    api/consult/       POST endpoint — clinical guard → phase → stub render
    api/health/        Liveness
  src/components/      Practice UI components + consult surface atoms
  src/lib/
    consult/           clinicalGuard · deflectionResponse · voiceRuleCheck · constants · types
    consult-runner.ts  Orchestration pipeline (deterministic stub, Week 3)
    content.ts         Practice content — embodiments, phases, session types, compliance
    theme.ts           Tone color palette

src/
  canonical/           Classification, scoring, thesis, validation, pipeline control
  organoid/            Phase inference, resonance scoring, orchestration contract, matrix state
  output/              Glyph and embodiment rendering
  state/ · ops/        Durable state, locks, launch gates, runtime controls
  context/ · prompts/  Thread context and prompt assembly

docs/
  methodology/         coaching-contexts.md — 3-context mode mapping
  lore/                Organoid canon, orchestration contract, embodiment specs
  landing-practice-route.md  Practice route plan and API contract
  compliance/          Safety and clinical boundary documentation

prompts/               System, task, preset, and fragment prompts
tests/                 Unit, integration, e2e, stress, golden tests
```

---

## Quick Start

```bash
pnpm install
cp .env.example .env

# Practice app
pnpm run dev:landing          # dev server → http://localhost:3000
pnpm run test:landing         # 63 Vitest tests (clinical guard, voice rules, consult runner)
pnpm run typecheck:landing
pnpm run build:landing

# Worker runtime
pnpm run dev                  # watcher-based worker
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

### Practice App Tests

```bash
pnpm --filter landing test
# ✓ clinicalGuard.test.ts     23 tests — 4-tier input guard
# ✓ voiceRuleCheck.test.ts    12 tests — output guard patterns
# ✓ content.practice.test.ts   9 tests — embodiment + phase data integrity
# ✓ consult-runner.test.ts    12 tests — orchestration pipeline
# ✓ route.test.ts              7 tests — API contract
```

### Full CI

```bash
pnpm run ci
# typecheck → lint → test → build → landing test → landing typecheck → landing lint → landing build
```

---

## Configuration

| Variable | Purpose |
|---|---|
| `LAUNCH_MODE` | `dry_run` for local / `live` for production |
| `LLM_PROVIDER` | `xai` / `anthropic` / `openai` |
| `XAI_API_KEY` · `ANTHROPIC_API_KEY` · `OPENAI_API_KEY` | Model provider credentials |
| `X_CLIENT_ID` · `X_CLIENT_SECRET` · `X_REFRESH_TOKEN` | X/Twitter auth (worker only) |
| `USE_REDIS=true` | Required for multi-worker production |
| `KV_URL` · `REDIS_KEY_PREFIX` | Durable state placement |
| `EMBODIMENT_ORCHESTRATION_ENABLED` | Enables stateful orchestration path |

---

## Canonical Docs

- [`docs/methodology/coaching-contexts.md`](./docs/methodology/coaching-contexts.md) — 3-context mode mapping
- [`docs/landing-practice-route.md`](./docs/landing-practice-route.md) — Practice route plan + API contract
- [`docs/lore/ORGANOID_ORCHESTRATION.md`](./docs/lore/ORGANOID_ORCHESTRATION.md) — Orchestration contract
- [`docs/lore/ORGANOID_EMBODIMENTS.md`](./docs/lore/ORGANOID_EMBODIMENTS.md) — Embodiment specifications
- [`docs/compliance/`](./docs/compliance/) — Safety and clinical boundary documentation
- [`README_SYMBIONTS.md`](./README_SYMBIONTS.md) — Operator cheat sheet

---

## Development Notes

- Keep embodiment terminology canonical. The seven identities are not interchangeable voice skins.
- The short-term matrix is runtime state, not lore. Do not persist it as canon.
- The clinical guard fires before any LLM call. Do not move deflection logic downstream.
- Voice rule violations are non-blocking in Week 3 (console.warn). Week 4 wires retry logic.
- Tokens before components. No magic numbers in component code — use `globals.css` design tokens.

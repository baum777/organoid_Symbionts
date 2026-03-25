# Organoid Symbiont Runtime

State-aware X/Twitter bot runtime with canonical mention handling, organoid orchestration, and short-term matrix state.

## What This Repo Is

This repository contains the production runtime for the Organoid Symbiont bot. The current stack is TypeScript-first and centers on a canonical pipeline that classifies incoming signals, derives a thesis, applies a stateful organoid orchestration contract, and renders the final reply or silence decision.

The key idea is:

`signal -> phase -> resonance -> roles -> expression -> validation`

That means the system does not jump directly from intent to persona. It first infers state, phase, tension, and role assignment, then lets the orchestration contract decide how the response should be expressed.

## Runtime Flow

```mermaid
flowchart LR
  A[Mention / timeline / trigger] --> B[Canonical classification]
  B --> C[Thesis and validation]
  C --> D[Organoid orchestration contract]
  D --> E[Prompt and render policy]
  E --> F[Reply, brief reply, or silence]
  D --> G[Short-term matrix state]
  G --> D
```

## Runtime Surface

- `src/canonical/**` - classification, scoring, thesis, validation, pipeline control, and audit hooks
- `src/organoid/**` - phase inference, resonance scoring, orchestration contract, and short-term matrix state
- `src/routing/embodimentSelector.ts` - legacy-compatible embodiment routing
- `src/output/renderEmbodimentGlyphs.ts` - glyph and visible embodiment rendering
- `src/state/**` and `src/ops/**` - durable state, locks, launch gates, and runtime controls
- `src/context/**` and `src/prompts/**` - thread context and prompt assembly
- `prompts/` - system, task, preset, and fragment prompts
- `render.yaml` - Render deployment blueprint
- `.env.example` - canonical environment template

## What It Does

- polls mentions and timeline engagement
- classifies, scores, and derives a thesis
- builds a stateful orchestration contract:
  `signal -> phase -> resonance -> roles -> expression -> validation`
- persists cursor, dedupe, publish state, and the short-term organoid matrix in `StateStore`
- renders replies through glyph-aware prompt fragments and conservative output policies
- exposes worker, health, and cron entrypoints for local and Render deployments

## Repository Map

- `src/index.ts` - main entrypoint
- `src/worker/` - worker orchestration and poller execution
- `src/server.ts` - HTTP server and health surfaces
- `src/canonical/` - canonical pipeline and validation backbone
- `src/organoid/` - runtime organoid orchestration and state
- `docs/` - active documentation for architecture, operations, lore, testing, and references
- `tests/` - unit, integration, end-to-end, stress, and golden tests

## Canonical Docs

- `docs/README.md`
- `docs/lore/README.md`
- `docs/architecture/README.md`
- `docs/operations/README.md`
- `docs/testing/README.md`
- `docs/reference/README.md`

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

## Local Run

- `pnpm run dev` for the watcher-based worker
- `pnpm run poll` for the dotenv-loaded poller
- `pnpm run start` for the built runtime
- `pnpm run organoid:build-semantic` to regenerate semantic artifacts

## Validation and CI

Use `pnpm run ci` to run the same local validation sequence that the repository expects in CI.

The GitHub Actions workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) currently runs:

- TypeScript typecheck
- ESLint
- Vitest
- production build

It runs on Node 20 with pnpm 9 and installs dependencies with `pnpm install --frozen-lockfile`.

## Configuration

- `.env.example` is the active environment template
- `render.yaml` is the deploy blueprint
- `EMBODIMENT_ORCHESTRATION_ENABLED` enables the stateful orchestration path
- `USE_REDIS=true` is required for multi-worker production
- `KV_URL` and `REDIS_KEY_PREFIX` control durable state placement
- `LAUNCH_MODE`, `LLM_PROVIDER`, and provider-specific keys control runtime posture
- `X_CLIENT_ID`, `X_CLIENT_SECRET`, and `X_REFRESH_TOKEN` are required for X/Twitter auth
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `XAI_API_KEY` enable the configured model providers
- `REPLICATE_API_KEY` and `REPLICATE_IMAGE_MODEL` are used for image generation workflows

## Canonical Docs

- [Architecture](./docs/architecture/README.md)
- [Operations](./docs/operations/README.md)
- [Lore](./docs/lore/README.md)
- [Testing](./docs/testing/README.md)
- [Reference](./docs/reference/README.md)

## Contribution Notes

- Keep Organoid terminology canonical in new code and docs.
- Avoid reintroducing parallel identity layers or prompt-only orchestration.
- Treat the short-term matrix as runtime state, not lore.
- Regenerate derived artifacts instead of hand-editing them.
- Prefer additive changes that preserve the existing safety and validation backbone.

# Organoid Symbiont Runtime

State-aware X/Twitter bot runtime with organoid orchestration, canonical mention handling, and short-term matrix state.

## Runtime Surface

- `src/canonical/**` - classification, scoring, thesis, validation, and pipeline control
- `src/organoid/**` - phase inference, resonance scoring, orchestration contract, short-term matrix
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
pnpm typecheck
pnpm test
pnpm build
```

## Local Run

- `pnpm dev` for the watcher-based worker
- `pnpm poll` for the dotenv-loaded poller
- `pnpm start` for the built runtime
- `pnpm organoid:build-semantic` to regenerate semantic artifacts

## Configuration

- `.env.example` is the active environment template
- `render.yaml` is the deploy blueprint
- `EMBODIMENT_ORCHESTRATION_ENABLED` enables the stateful orchestration path
- `USE_REDIS=true` is required for multi-worker production
- `LAUNCH_MODE`, `LLM_PROVIDER`, and provider-specific keys control runtime posture

## Contribution Notes

- Keep Organoid terminology canonical in new code and docs.
- Avoid reintroducing parallel identity layers or prompt-only orchestration.
- Treat the short-term matrix as runtime state, not lore.
- Regenerate derived artifacts instead of hand-editing them.

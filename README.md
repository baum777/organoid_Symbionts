# Organoid Entities as Semantic Symbiont

Organoid-first social agent runtime for X/Twitter.

The canonical runtime surface is the organoid embodiment system:
- `src/embodiment/**`
- `src/embodiments/**`
- `src/routing/embodimentSelector.ts`
- `src/output/renderEmbodimentGlyphs.ts`
- `prompts/`
- `render.yaml`
- `.env.example`

## What it does

- Polls mentions from X
- Selects an organoid embodiment
- Builds replies with the configured LLM provider
- Persists cursor, dedupe, and publish state in `StateStore`
- Exposes Render health, worker, and cron entrypoints

## Canonical docs

- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/ORGANOID_ORCHESTRATION.md`
- `docs/lore/README.md`
- `render.yaml`
- `.env.example`

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm typecheck
pnpm test
pnpm build
```

## Local run

- `pnpm dev` for the worker
- `pnpm poll` for the dotenv-loaded poller
- `pnpm start` for the built runtime
- `pnpm organoid:build-semantic` to regenerate semantic artifacts

## Deployment

The Render Blueprint in `render.yaml` is the deploy path.
Set the required secrets in Render, then apply the blueprint.

## Configuration

Treat `.env.example` as the active environment template.
Render injects platform values such as `PORT`, `NODE_ENV`, and service metadata at runtime.

## Contribution notes

- Keep Organoid terminology canonical in new code and docs.
- Avoid reintroducing parallel identity layers.
- Regenerate derived artifacts instead of hand-editing them.

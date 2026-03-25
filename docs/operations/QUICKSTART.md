# QUICKSTART

Minimal guide to run the current TypeScript runtime locally.

> Environment variables are defined in `.env.example` and summarized in `docs/operations/var.README.md`.
> Use `.env.example` as the template to copy and fill for local runs.

## 1. Prerequisites

- Node.js 20+
- pnpm
- X OAuth credentials
- LLM provider key for the active provider
- `KV_URL` only when using Redis-backed state

## 2. Install dependencies

```bash
pnpm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Set the required values for your mode:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REFRESH_TOKEN`
- `XAI_API_KEY` or `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `LAUNCH_MODE`
- `BOT_USERNAME`
- `USE_REDIS` and `KV_URL` when running shared state

For the current organoid runtime, `EMBODIMENT_ORCHESTRATION_ENABLED` stays off by default until you intentionally enable it.

## 4. Verify the build

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 5. Start locally

```bash
pnpm poll
```

or, for watcher-based development:

```bash
pnpm dev
```

Expected:

- the worker starts without validation errors
- the state store initializes
- logs show provider and launch-mode initialization
- the health endpoints are available once the runtime is up

## 6. Where to go next

| Topic | File |
|-------|------|
| Variables | `.env.example` |
| Embodiment matrix | `docs/lore/ORGANOID_EMBODIMENTS.md` |
| Orchestration | `docs/lore/ORGANOID_ORCHESTRATION.md` |
| Architecture | `docs/architecture/` |
| Workflow reference | `docs/workflows/` |
| Monitoring | `docs/operations/monitoring.md` |

## Drift Prevention Rule

- Environment variables belong in `.env.example` and `docs/operations/var.README.md`
- Setup instructions belong in `docs/operations/QUICKSTART.md`
- Workflow references belong in `docs/workflows/`

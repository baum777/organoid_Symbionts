# Deployment

## Runtime Model

The runtime is a TypeScript/Node worker process with an optional health web service and an optional cron job.

A separate Next.js landing app now lives in `apps/landing/` so the public web surface can ship on its own deploy path without touching the worker runtime.

## Local Deployment

- `pnpm dev` for the watch-mode worker
- `pnpm poll` for the dotenv-loaded worker entrypoint
- `pnpm start` for the built runtime

## Render Deployment

- `render.yaml` is the current deployment blueprint
- worker, health, and cron services are defined there
- the landing page is deployed as its own Render web service
- `USE_REDIS=true` is required for multi-worker production
- `KV_URL` must point at a shared Redis instance for production coordination

## Environment Variables

Environment variables are defined in `.env.example` and mirrored for operators in `docs/operations/var.README.md`.

Operationally important variables include:

- X OAuth: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`
- LLM: `LLM_PROVIDER`, `XAI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- Launch control: `LAUNCH_MODE`, `BOT_ACTIVATION_MODE`, `BOT_USERNAME`
- State store: `USE_REDIS`, `KV_URL`, `REDIS_KEY_PREFIX`, `DATA_DIR`
- Organoid runtime: `EMBODIMENTS_ENABLED`, `EMBODIMENT_ORCHESTRATION_ENABLED`, `EMBODIMENT_CONTINUITY_ENABLED`

## Health Checks

Use the runtime HTTP endpoints:

- `GET /health`
- `GET /ready`
- `GET /metrics`

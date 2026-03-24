# Deployment

## Runtime Model

Worker process with scheduler loop - polls at configurable intervals.

## Docker

```bash
docker build -t xai-bot .
docker run -e X_API_KEY=... -e XAI_API_KEY=... xai-bot
```

## Environment Variables

Environment variables are defined in `.env.example` and mirrored for operators in
`docs/operations/var.README.md`.

Operationally important variables include:
- X OAuth: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`, `X_ACCESS_TOKEN`
- LLM: `XAI_API_KEY`, `XAI_BASE_URL`, `XAI_MODEL_PRIMARY`, `XAI_MODEL_FALLBACKS`
- Launch control: `LAUNCH_MODE`, `BOT_ACTIVATION_MODE`, `BOT_USERNAME`
- State store: `USE_REDIS`, `KV_URL`, `REDIS_KEY_PREFIX`

## Health Checks

Use the runtime HTTP endpoints:

- `GET /health`
- `GET /ready`
- `GET /metrics`

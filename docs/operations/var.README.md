# Environment Variables

`.env.example` is the canonical template for local and deploy-time configuration.
`render.yaml` provides the Render-specific defaults and secret slots.

This guide is a compact operator reference, not a second source of truth.

## Required for Deploy

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REFRESH_TOKEN`
- `KV_URL` when using Redis-backed shared state
- the active LLM provider key: `XAI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`

## Core Runtime Values

- `LAUNCH_MODE`
- `LOG_LEVEL`
- `BOT_USERNAME`
- `BOT_ACTIVATION_MODE`
- `BOT_DENY_REPLY_MODE`
- `USE_REDIS`
- `REDIS_KEY_PREFIX`
- `DATA_DIR`
- `POLL_INTERVAL_MS`
- `MENTIONS_SOURCE`
- `ADAPTIVE_POLLING_ENABLED`
- `X_REFRESH_BUFFER_SECONDS`
- `X_OAUTH_TOKEN_URL`

## Optional X OAuth Bootstrap State

- `X_ACCESS_TOKEN`
- `X_EXPIRES_IN`
- `X_TOKEN_CREATED_AT`
- `X_BOT_USER_ID`

## Organoid Runtime

- `EMBODIMENTS_ENABLED`
- `EMBODIMENT_ORCHESTRATION_ENABLED`
- `EMBODIMENT_CONTINUITY_ENABLED`
- `EMBODIMENT_MEMORY_ENABLED`
- `EMBODIMENT_ROUTING_DEBUG`
- `EMBODIMENT_TRAIT_DRIFT_LIMIT`
- `EMBODIMENT_SWARM_ENABLED`
- `EMBODIMENT_ENSEMBLE_ENABLED`
- `EMBODIMENT_AUTONOMY_ENABLED`
- `EMBODIMENT_ARC_ENGINE_ENABLED`

## LLM Provider Selection

- `LLM_PROVIDER`
- `LLM_FALLBACK_PROVIDER`
- `LLM_API_KEY`
- `XAI_API_KEY`
- `XAI_BASE_URL`
- `XAI_MODEL_PRIMARY`
- `XAI_MODEL_FALLBACKS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_BASE_URL`

## Optional Controls

- `ALLOWLIST_HANDLES`
- `BOT_WHITELIST_USERNAMES`
- `BOT_WHITELIST_USER_IDS`
- `SKIP_ENV_VALIDATION`
- `DEBUG_ARTIFACTS`
- `RATE_LIMIT_BACKEND`
- `POLL_LOCK_ENABLED`
- `FULL_SPECTRUM_PROMPT`
- `REPLICATE_API_KEY`
- `REPLICATE_IMAGE_MODEL`
- `REPLICATE_RUN_TIMEOUT_MS`
- `REPLICATE_DOWNLOAD_TIMEOUT_MS`

## Notes

- Render injects platform values such as `PORT` and `NODE_ENV`.
- Keep secrets out of Git; fill them in Render or a local `.env` file.
- If a variable is not listed in `.env.example`, treat it as non-canonical.

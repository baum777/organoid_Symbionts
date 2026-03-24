# Environment Variables

`.env.example` is the canonical template for local and deploy-time configuration.
`render.yaml` provides the Render-specific defaults and secret slots.

This guide is a compact operator reference, not a second source of truth.

## Required for deploy

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REFRESH_TOKEN`
- `XAI_API_KEY`
- `KV_URL`

## Important runtime values

- `LAUNCH_MODE`
- `LOG_LEVEL`
- `BOT_USERNAME`
- `BOT_ACTIVATION_MODE`
- `BOT_DENY_REPLY_MODE`
- `USE_REDIS`
- `REDIS_KEY_PREFIX`
- `POLL_INTERVAL_MS`
- `MENTIONS_SOURCE`
- `ADAPTIVE_POLLING_ENABLED`
- `DATA_DIR`
- `X_REFRESH_BUFFER_SECONDS`
- `X_OAUTH_TOKEN_URL`
- `XAI_BASE_URL`
- `XAI_MODEL_PRIMARY`
- `XAI_MODEL_FALLBACKS`

## Optional bootstrap and overrides

- `X_ACCESS_TOKEN`
- `X_EXPIRES_IN`
- `X_TOKEN_CREATED_AT`
- `X_BOT_USER_ID`
- `LLM_PROVIDER`
- `LLM_FALLBACK_PROVIDER`
- `LLM_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_BASE_URL`

## Optional feature flags

- `ALLOWLIST_HANDLES`
- `BOT_WHITELIST_USERNAMES`
- `BOT_WHITELIST_USER_IDS`
- `SKIP_ENV_VALIDATION`
- `DEBUG_ARTIFACTS`
- `RATE_LIMIT_BACKEND`
- `POLL_LOCK_ENABLED`
- `SEMANTIC_ENABLED`
- `SEMANTIC_MODE`
- `HYBRID_RUNTIME_MODE`

## Notes

- Render injects platform values such as `PORT` and `NODE_ENV`.
- Keep secrets out of Git; fill them in Render or a local `.env` file.
- If a variable is not listed in `.env.example`, treat it as non-canonical.

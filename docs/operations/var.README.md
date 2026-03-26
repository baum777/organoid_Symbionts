# Environment Variables

This document matches the current TypeScript runtime in `src/config/envSchema.ts`, `src/config/env.ts`, and `src/clients/xOAuthToken.ts`.

## Required X OAuth2

These are required for worker and engagement flows:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REFRESH_TOKEN`

## X OAuth2 Runtime

- `X_ACCESS_TOKEN` - optional cached access token
- `X_REFRESH_BUFFER_SECONDS` - refresh threshold before expiry
- `X_OAUTH_TOKEN_URL` - OAuth2 token endpoint, default `https://api.x.com/2/oauth2/token`
- `X_BOT_USER_ID` - optional cached bot user id
- `X_BOT_USERNAME` - optional bot handle
- `BOT_USERNAME` - fallback bot handle used by older compatibility paths

## LLM Provider Routing

- `XAI_API_KEY`
- `XAI_BASE_URL`
- `XAI_MODEL_PRIMARY`
- `XAI_MODEL_FALLBACKS`
- `LLM_API_KEY` - generic provider fallback used by launch env resolution
- `LLM_PROVIDER` - `xai`, `openai`, or `anthropic`
- `LLM_FALLBACK_PROVIDER`
- `LLM_TIMEOUT_MS`
- `LLM_RETRY_MAX`
- `LLM_MAX_TOKENS`
- `LLM_TEMPERATURE`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_BASE_URL`

## Launch Gates

- `LAUNCH_MODE` - `off`, `dry_run`, `staging`, `prod`
- `DRY_RUN` - legacy compatibility flag, still supported
- `LEGACY_COMPAT` - enables legacy fallback surfaces
- `ALLOWLIST_HANDLES` - comma-separated staging allowlist
- `DEBUG_ARTIFACTS` - enables extra debug artifacts when true

## Persistence and State

- `USE_REDIS` - prefer Redis when `true`
- `KV_URL` - `redis://` or `rediss://` URL for the state store
- `REDIS_KEY_PREFIX` - key prefix for Redis-backed state
- `DATA_DIR` - filesystem state store directory for local runs

## Polling and Timeline Engagement

- `POLL_INTERVAL_MS`
- `TIMELINE_ENGAGEMENT_ENABLED`
- `TIMELINE_ENGAGEMENT_INTERVAL_MS`
- `TIMELINE_ENGAGEMENT_MAX_PER_RUN`
- `TIMELINE_ENGAGEMENT_MAX_PER_HOUR`
- `TIMELINE_ENGAGEMENT_MAX_PER_DAY`
- `TIMELINE_MIN_CONTEXT_SCORE`
- `TIMELINE_MIN_FINAL_SCORE`
- `TIMELINE_REQUIRE_THREAD_STRUCTURE`
- `TIMELINE_SOURCE_ACCOUNTS`
- `TIMELINE_KEYWORD_FILTERS`
- `TIMELINE_AUTHOR_COOLDOWN_MINUTES`
- `TIMELINE_CONVERSATION_COOLDOWN_MINUTES`

## Solana RPC / Onchain

- `SOLANA_RPC_PRIMARY_URL`
- `SOLANA_RPC_FALLBACK_URL`
- `BOT_TOKEN_MINT`
- `BOT_TREASURY_WALLET`
- `BOT_TICKER`
- `BOT_PROGRAM_ID`

## Server / Tooling

- `PORT`
- `NODE_ENV`
- `SKIP_ENV_VALIDATION`

## Recommended Minimal Setup

```bash
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REFRESH_TOKEN=...
LAUNCH_MODE=dry_run
USE_REDIS=false
```

## Recommended Production Setup

```bash
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REFRESH_TOKEN=...
X_ACCESS_TOKEN=...
LAUNCH_MODE=prod
USE_REDIS=true
KV_URL=redis://...
SOLANA_RPC_PRIMARY_URL=https://api.mainnet-beta.solana.com
```

## Notes

- `X_ACCESS_TOKEN` is cached only; the refresh token is the source of truth for renewal.
- `LAUNCH_MODE=off` is the safest local default when you are only inspecting the repo.
- Keep the older `DRY_RUN` flag only for compatibility during the transition.

# Launch Runbook — Organoid Symbiont Runtime

## Staging Deploy Steps

1. Set environment variables

```bash
LAUNCH_MODE=staging
LOG_LEVEL=info
LLM_PROVIDER=xai
XAI_API_KEY=<your-xai-key>
ALLOWLIST_HANDLES=@yourAccount,@testAccount
USE_REDIS=true
KV_URL=redis://...
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REFRESH_TOKEN=...
```

2. Run the local verification pass

```bash
pnpm install
pnpm ci
```

3. Dry-run rehearsal

```bash
LAUNCH_MODE=dry_run LOG_LEVEL=debug pnpm poll
```

- verify that no post is emitted
- inspect structured logs for the current runtime state, phase, and skip reasons

4. Staging deploy

- deploy with `LAUNCH_MODE=staging`
- keep `ALLOWLIST_HANDLES` set
- keep `USE_REDIS=true` and a shared `KV_URL`
- only allowlisted handles may publish

5. Smoke test

- send a small allowlisted batch of mentions
- verify replies, logs, and metrics
- if `DEBUG_ARTIFACTS=true`, inspect the generated artifacts

## Production Deploy Steps

1. Pre-flight

- run `pnpm ci`
- confirm secrets are set
- ensure the active LLM provider key matches `LLM_PROVIDER`

2. Deploy

- set `LAUNCH_MODE=prod`
- disable staging allowlists
- keep Redis-backed shared state for multi-worker production

3. Kill-switch

- set `LAUNCH_MODE=dry_run` or `LAUNCH_MODE=off`
- restart the worker
- `dry_run` keeps processing but suppresses publish
- `off` stops the LLM path entirely

## Rollback Steps

| Severity | Action | Recovery |
|---|---|---|
| Soft | `LAUNCH_MODE=dry_run` + restart | Fix issue, then return to `prod` |
| Hard | `LAUNCH_MODE=off` + restart | Same as above |
| Critical | Stop process, revert deploy | Deploy previous version, restore env |

## Dedupe & Rate Limiting

- `DedupeGuard` prevents double replies across restarts and races
- the runtime rate limiter blocks bursts before generation or publish
- skips are logged and visible in audit / metrics

## Incident Checklist

- [ ] switch to `dry_run` or `off` immediately if replies look wrong
- [ ] use `LOG_LEVEL=debug` when tracing a bad decision
- [ ] check whether the state store is reachable
- [ ] inspect the audit record for phase, lead embodiment, silence policy, and render policy
- [ ] if the LLM fails repeatedly, confirm provider auth and fallback config

## Env Reference

| Var | Required | Default | Description |
|---|---|---|---|
| `LAUNCH_MODE` | No (inferred) | `prod` / `dry_run` | `off`, `dry_run`, `staging`, `prod` |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `X_CLIENT_ID` | Yes | — | X OAuth client ID |
| `X_CLIENT_SECRET` | Yes | — | X OAuth client secret |
| `X_REFRESH_TOKEN` | Yes | — | X OAuth refresh token |
| `LLM_PROVIDER` | No | `xai` | `xai`, `openai`, `anthropic` |
| `LLM provider key` | When LLM is active | — | `XAI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` matching `LLM_PROVIDER` |
| `LLM_FALLBACK_PROVIDER` | Optional | — | Secondary provider for transient failures |
| `ALLOWLIST_HANDLES` | Staging | — | Handles allowed to publish in staging |
| `DEBUG_ARTIFACTS` | No | `false` | Write run artifacts to `.run-artifacts` |
| `KV_URL` | Redis mode | — | Shared Redis state store URL |

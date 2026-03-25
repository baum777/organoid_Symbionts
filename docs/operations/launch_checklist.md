# Launch Checklist — Go/No-Go

## Pre-Launch (All Must Pass)

- [ ] `pnpm run ci` passes
- [ ] X OAuth secrets are set: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`
- [ ] LLM provider key is set for the active provider
- [ ] `KV_URL` is set when using Redis-backed shared state
- [ ] `USE_REDIS=true` is set for multi-worker production
- [ ] staging allowlist is set when running in staging
- [ ] `LAUNCH_MODE=dry_run pnpm poll` runs without publishing
- [ ] smoke tests pass
- [ ] publish-gate / E2E tests pass

## Launch Procedure

### 1. Local Rehearsal

```bash
pnpm install
pnpm run ci
LAUNCH_MODE=dry_run LOG_LEVEL=debug pnpm poll
```

### 2. Staging

- Set `LAUNCH_MODE=staging`
- Set `ALLOWLIST_HANDLES=@yourAccount,@testAccount`
- Keep `USE_REDIS=true` and `KV_URL` pointed at the shared store
- Verify that only allowlisted accounts are eligible to publish

### 3. Production

- Set `LAUNCH_MODE=prod`
- Remove or disable staging allowlists
- Keep the kill-switch ready: `LAUNCH_MODE=dry_run` or `off`

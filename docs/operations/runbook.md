# Runbook

Operational runbook for the current TypeScript worker runtime.

## Start

```bash
pnpm install
cp .env.example .env
pnpm build
pnpm start
```

## Development / Dry Run

```bash
pnpm install
cp .env.example .env
LAUNCH_MODE=dry_run pnpm poll
```

Dry-run mode still evaluates the canonical pipeline and orchestration contract, but it must not publish.

## Health / Readiness

- `GET /health` - full health report
- `GET /ready` - state-store reachability only
- `GET /metrics` - current in-process metrics snapshot

Health currently checks:

- state store reachability
- recent poll success
- backlog / failure streaks
- timeline hardening
- audit buffer and cursor loadability when the health deps are wired

## Stop

Graceful shutdown via `SIGTERM`; the worker stops after finishing the current tick.

## Common Tasks

### Run CI checks

```bash
pnpm ci
```

### Conversation simulation

```bash
pnpm simulate
pnpm simulate:ci
```

## Canonical References

- Setup: `docs/operations/QUICKSTART.md`
- Env vars: `.env.example` and `docs/operations/var.README.md`
- Launch controls: `docs/operations/launch_runbook.md`

# Debugging Guide

## Enable Debug Mode

Set `LOG_LEVEL=debug` for the broadest runtime trace.

Useful feature flags:

- `EMBODIMENT_ROUTING_DEBUG=true`
- `DEBUG_ARTIFACTS=true`
- `EMBODIMENT_ORCHESTRATION_ENABLED=true` when you want to inspect the orchestration path

## Decision Tracing

The current pipeline logs the main decision chain:

- classifier output
- scoring bundle
- thesis bundle
- launch gate result
- organoid orchestration contract
- audit record and skip reason

If a skip is orchestration-driven, look for:

- `phase`
- `leadEmbodimentId`
- `silencePolicy`
- `renderPolicy`
- `skip_orchestration_silence`

## Common Issues

### Duplicate actions

Check the persisted StateStore markers. Events are deduplicated by ID through the shared state layer; in Redis mode this is cross-process, in filesystem mode it is single-worker.

### Rate limit errors

The runtime rate limiter enforces the current launch policy. Verify:

- `USE_REDIS=true` and a valid `KV_URL` when running multi-worker
- `REDIS_KEY_PREFIX` matches the deployment namespace

### xAI / LLM errors

- verify the active provider key matches `LLM_PROVIDER`
- check for auth errors versus transient provider errors
- use the provider fallback only for transient failures

### X API errors

Verify OAuth credentials. `401` is usually auth; `429` is usually rate limiting.

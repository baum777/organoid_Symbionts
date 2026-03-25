# Mention Handling Workflow

> This is a high-level workflow description. For the authoritative runtime path, see the canonical pipeline and worker flow in `src/` and the docs indices: `docs/architecture/` and `docs/operations/runbook.md`.

## Trigger

The bot receives an @mention via the X API.

## Flow

1. Normalize the X payload into a canonical event.
2. Classify the event and derive intent, score, and thesis.
3. Load the current short-term organoid matrix.
4. Build the orchestration contract:
   - phase
   - resonance
   - lead / counterweight / anchor roles
   - silence policy
   - render policy
5. Assemble the prompt and render surface.
6. Validate against launch mode, safety, dedupe, and policy gates.
7. Publish or short-circuit with an explicit skip reason.
8. Persist cursor, audit, and matrix state.

## Rate Limits

Rate limiting and posting policy are enforced by the runtime rate limiter and launch gate; exact thresholds are config- and deployment-dependent.

## Error Handling

- Duplicate: abort, no action
- Rate limit: abort, log warning
- Launch gate silence: short-circuit with `skip_orchestration_silence` when the orchestration policy decides not to speak
- API error: retry with bounded backoff

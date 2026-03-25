# Monitoring

## Metrics

The current in-process registry exposes these main counters and gauges:

- `mentions_seen_total`
- `mentions_processed_total`
- `mentions_skipped_total`
- `mentions_failed_total`
- `publish_attempt_total`
- `publish_success_total`
- `publish_failure_total`
- `publish_duplicate_prevented_total`
- `state_store_error_total`
- `poll_lock_acquired_total`
- `poll_lock_failed_total`
- `timeline_lock_acquired_total`
- `timeline_lock_denied_total`
- `timeline_pipeline_entered_total`
- `engagement_decision_engage_total`
- `engagement_decision_hold_no_budget_total`
- `engagement_decision_skip_no_consent_total`
- `pulse_heart_signal`
- `pulse_heart_resonance`
- `pulse_heart_drift`
- `pulse_heart_coherence`
- `pulse_heart_phase_index`

## Log Levels

- `debug` - prompt assembly, orchestration, and decision traces
- `info` - worker progress, successful actions, health transitions
- `warn` - retries, limits, degraded state
- `error` - failed actions, API errors, state-store issues

## Health Checks

Prefer the built-in HTTP endpoints:

- `GET /health` - full health: state store, recent poll success, backlog signals, timeline hardening
- `GET /ready` - state-store ping only
- `GET /metrics` - in-process metrics snapshot

## Monitoring Rule

Keep the health and metrics docs aligned with the current worker, Render services, and orchestration contract. If a skip is driven by orchestration, make sure the audit trail explains the phase, lead embodiment, silence policy, and render policy.

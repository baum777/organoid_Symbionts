# Monitoring

## In-Process Metrics

The runtime metrics registry lives in `src/observability/metricTypes.ts` and `src/observability/metrics.ts`.

Common counters:
- `mentions_seen_total`
- `mentions_processed_total`
- `mentions_skipped_total`
- `mentions_blocked_total`
- `mentions_failed_total`
- `publish_attempt_total`
- `publish_success_total`
- `publish_failure_total`
- `publish_duplicate_prevented_total`
- `engagement_decision_review_total`
- `engagement_decision_engage_total`
- `verification_verified_total`
- `verification_unverified_total`
- `verification_degraded_total`

Common gauges:
- `current_poll_interval_ms`
- `recent_failure_streak`
- `last_cursor_age_seconds`
- `pulse_heart_signal`
- `pulse_heart_resonance`
- `pulse_heart_drift`
- `pulse_heart_coherence`
- `pulse_heart_phase_index`

Common histograms:
- `fetch_duration_ms`
- `llm_generation_duration_ms`
- `publish_duration_ms`
- `mention_processing_duration_ms`
- `state_store_operation_duration_ms`
- `tool_latency_ms`
- `verification_pipeline_duration_ms`

## HTTP Surfaces

Prefer the built-in HTTP endpoints exposed by `src/server.ts`:
- `GET /health` for full health and glyph status
- `GET /ready` for store ping readiness
- `GET /metrics` for Prometheus-style text metrics
- `GET /glyph` for the overlay
- `GET /glyph-status` for the compact summary payload
- `GET /glyph.svg` for the SVG glyph
- `GET /glyph.json` for the full pulse snapshot

## Log Levels

- `DEBUG` - prompts, responses, full context
- `INFO` - workflow steps, successful actions
- `WARNING` - rate limits, retries, cooldowns
- `ERROR` - failed actions, API errors
- `CRITICAL` - auth failures, data corruption

## Operator Rule

Treat the production runtime as TypeScript/Node. Any legacy Python health scripts are reference-only unless explicitly wired into deployment.

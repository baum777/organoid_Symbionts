# Compliance Test Spec

This spec validates that the consent / energy / decision layer is fail-closed in all RED zones.

## Unit Coverage

- `tests/unit/policy/consentEvaluator.test.ts`
- `tests/unit/policy/energyEvaluator.test.ts`
- `tests/unit/policy/engagementDecision.test.ts`

## Integration Coverage

- `tests/integration/pipeline/proactiveEngagementPipeline.test.ts`
- `tests/integration/pipeline/mentionPipelineConsentFlow.test.ts`
- `tests/integration/pipeline/writePreflightCompliance.test.ts`

## Observability Coverage

- `tests/e2e/operator/compliance-surfaces.spec.ts`
- `tests/e2e/operator/blocked-write-observability.spec.ts`

## Release Gates

The build is not release-ready unless all of the following are true:

- search-only candidates never reach `ENGAGE`
- opt-out always wins
- AI approval is required for AI-generated replies
- invalid auth is blocked before write
- duplicate interactions cannot be written twice
- `HOLD`, `REVIEW`, and `SKIP` never create write side effects
- reason codes are emitted consistently in logs and metrics


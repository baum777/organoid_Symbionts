# Consent / Energy / Decision Layer

This document describes the compliance-first engagement layer that sits in front of the canonical generation pipeline.

## Purpose

The layer is fail-closed by design.

It separates three concerns:

1. **Consent** - may the system interact at all?
2. **Energy** - is the current signal strong and natural enough to consider?
3. **Decision** - does the runtime allow a write attempt after budget, auth, and duplicate checks?

## Runtime States

### Consent

`NONE`
: No usable consent signal.

`WEAK_CONTEXT`
: Weak historical or contextual permission only. Never auto-write.

`INTERACTION_BASED`
: Direct mention, reply, or quote-style interaction.

`EXPLICIT`
: Explicit opt-in or durable permission state.

`OPTOUT`
: Immediate hard stop. Overrides everything else.

`BLOCKED`
: Policy disallowance. Hard stop.

### Energy Bands

`E0`
: Dead or noisy signal.

`E1`
: Low signal. May be retained for review, but not written.

`E2`
: Moderate signal. Candidate may be reviewed if consent is valid.

`E3`
: Strong signal. Still requires valid consent and runtime preflight.

### Decision Outputs

`SKIP`
: No generation, no write.

`HOLD`
: Candidate is retained, but no write-side effect occurs.

`REVIEW`
: Candidate is still non-writing until final preflight passes.

`ENGAGE`
: The only state that can progress into generation and write preflight.

`BLOCK`
: Hard fail-closed state for auth, opt-out, approval, or policy violations.

## Hard Gates

The following states always stop the path:

- opt-out present
- invalid auth
- missing AI approval
- target missing or deleted
- duplicate interaction already handled
- budget exhausted
- policy-blocked candidate

## Architectural Rule

Consent is evaluated before energy.
Energy is evaluated before engagement.
Write is always the last step and must be preflighted.

No search hit, relevance score, or energy score may create consent by itself.

## Repository Linkage

- `src/engagement/consentEvaluator.ts`
- `src/engagement/energyEvaluator.ts`
- `src/engagement/engagementDecision.ts`
- `src/engagement/writePreflight.ts`
- `src/worker/pollMentions.ts`
- `src/worker/pollTimelineEngagement.ts`


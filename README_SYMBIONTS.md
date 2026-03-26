# Organoid Symbiont Operator Cheat Sheet

This repository is a fail-closed, approval-gated runtime. It does not self-modify, does not auto-post without approval, and does not treat onchain state as consciousness or identity.

## What The System Is

- A deterministic X engagement runtime
- A prompt-composition and lore-candidate system
- A pulse/observability surface for matrix, glyph, and phase state
- A minimal Solana read path for verification and proof-of-event workflows

## Safe Operating Rules

- Candidate generation is review-only until a human approves activation
- Outbound writes must pass consent, energy, duplicate, launch-mode, and public-text gates
- Onchain writes remain minimal and approval-gated
- BCI work is simulation-only unless a later review explicitly approves hardware integration

## Primary Commands

- `pnpm symbiont-health-check`
- `pnpm deploy-check`
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`

## Runtime Surfaces

- `GET /health`
- `GET /ready`
- `GET /metrics`
- `GET /glyph`
- `GET /glyph-status`
- `GET /glyph.svg`
- `GET /glyph.json`

## Canonical Prompt Assets

- `prompts/fragments/sharedOrganoidCanon.md`
- `prompts/presets/initiate-symbiosis.md`
- `prompts/fragments/organoids/*.md`

## Recovery Notes

- Use `LAUNCH_MODE=dry_run` for local experimentation
- Use `LEGACY_COMPAT=true` only when you need compatibility fallback behavior
- If a deployment looks unstable, fail closed and revert to the last known good image plus prompt bundle

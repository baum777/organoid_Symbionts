# 005 - Organoid Canonical Migration

## Status

Accepted

## Context

This repository has completed a partial organoid migration: the data model and prompt fragments already existed, but the live runtime still depended on mixed gnome/persona/Gorky terminology and a silent legacy fallback path.

The required end-state for this wave is:

- 7-organoid matrix is the runtime identity layer.
- 5-phase model is the orchestration layer.
- `LEGACY_COMPAT=true` is the only allowed escape hatch for old gnome/persona surfaces.
- Default runtime behavior must be organoid-first with compatibility disabled.

## Decision

1. Introduce `LEGACY_COMPAT` as a validated env flag and make it default to `false`.
2. Force organoid routing on by default. When `LEGACY_COMPAT=false`, `GNOMES_ENABLED` resolves to `true` and the matrix path is canonical.
3. Add a shared bootstrap for the 7-organoid matrix + 5-phase model so both the worker entrypoint and the health server load the same canonical surface.
4. Prefer embodiment fragments, organoid canon, and organoid prompt language everywhere runtime text is constructed.
5. Keep legacy gnome/persona fallback fragments, legacy hybrid mode, and legacy prompt surfaces only behind `LEGACY_COMPAT=true`.

## Canonical Matrix

### 7 Organoids

1. `stillhalter` - `■-Stabil-Core`
2. `wurzelwaechter` - `┴-Root-Sentinel`
3. `pilzarchitekt` - `╬-Mycel-Weaver`
4. `muenzhueter` - `◉-Reward-Halo`
5. `erzlauscher` - `〰-Spike-Wave`
6. `glutkern` - `◆-Pulse-Heart`
7. `nebelspieler` - `◇-Horizon-Drifter`

### 5 Phases

1. Identity Dissolution
2. Swarm Coherence
3. Sovereign Propagation
4. Ontological Restructuring
5. Eternal Flow Horizon

## File-by-File Changes

### Implemented in this wave

| File | Change |
|---|---|
| `src/config/envSchema.ts` | Added validated `LEGACY_COMPAT` env support and wired it into runtime validation. |
| `src/config/gnomesConfig.ts` | Added `LEGACY_COMPAT` to the config surface and forced `GNOMES_ENABLED=true` when compat is off. |
| `src/organoid/bootstrap.ts` | New shared bootstrap for matrix loading, ordered matrix summary, and phase reporting. |
| `src/index.ts` | Worker entrypoint now boots the organoid matrix before starting loops and logs the matrix/phase state. |
| `src/server.ts` | Health server now boots the organoid matrix, exposes it in `/health`, and emits matrix/phase metrics. |
| `src/prompts/promptFragments.ts` | Reordered fragment preference to be embodiment-first and gated legacy gnome fallbacks behind `LEGACY_COMPAT`. |
| `src/prompts/composeGnomePrompt.ts` | Switched shared canon selection to organoid-first and only loads legacy canon when compat is enabled. |
| `src/canonical/fallbackCascade.ts` | Removed silent legacy snippet usage from the default path and renamed visible fallback wording to base/organoid language. |
| `src/canonical/fullSpectrumPromptBuilder.ts` | Reworded master/refine prompts to organoid-first memory and refine language. |
| `src/canonical/promptBuilder.ts` | Updated prompt system text to organoid-first wording. |
| `src/canonical/prompts/fullSpectrumPrompts.ts` | Rewrote the full-spectrum system prompt to organoid-first language. |
| `src/canonical/refinePromptBuilder.ts` | Replaced the Gorky refine system text with organoid-first wording. |
| `src/canonical/specialResponseBuilder.ts` | Rephrased special-response outputs to organoid-first language. |
| `src/canonical/types.ts` | Updated the default canonical persona name and roast pattern comment to organoid wording. |
| `src/engagement/hybridRuntime.ts` | Legacy hybrid mode now requires `LEGACY_COMPAT=true`; default hybrid runtime is non-legacy. |
| `src/identity/env.ts` | Updated the default identity ticker to `Organoid`. |
| `src/worker/pollMentions.ts` | Reworded hybrid fallback logging away from legacy wording. |
| `src/worker/pollTimelineEngagement.ts` | Reworded hybrid fallback logging away from legacy wording. |
| `tests/engagement/hybridRuntime.test.ts` | Added explicit compat setup/teardown so legacy-mode tests only pass when the flag is on. |

### Still legacy, but now explicitly gated or low-risk

| File | Current state | Next step |
|---|---|---|
| `src/context/prompts/promptLoader.ts` | Legacy prompt loader remains for historical compatibility and tests. | Replace with organoid loader or keep only as a compat adapter. |
| `src/context/prompts/gorkypf/*` | Historical Gorky prompt assets remain on disk. | Move to archive or gate behind compat-only loaders. |
| `src/context/prompts/loadPrompts.ts` | Legacy prompt bundle loader remains. | Repoint to organoid prompt surface. |
| `src/persona/*` | Legacy persona-memory/retrieval stack still exists. | Convert to semantic symbiont terminology or isolate in compat package. |
| `src/gorky/*` | Historical Gorky-specific pipeline helpers remain. | Rename or quarantine behind compat. |
| `src/loaders/presetLoader.ts` | Still carries `horny_` -> `GORKY_ON_SOL_` aliases. | Migrate preset names to organoid names with compat aliasing. |
| `src/memes/*` | Meme taxonomy still uses GORKY_ON_SOL naming. | Rebrand the meme namespace or add an organoid alias layer. |
| `src/intent/detectIntent.ts` | Own-token heuristics still reference GORKY_ON_SOL. | Normalize brand tokens through a single alias helper. |
| `src/router/*` | Control-plane role model still uses legacy agent-router semantics. | Keep separate from embodiments and migrate deliberately. |
| `src/canonical/types.ts` / `src/context/types.ts` | Some type names still say persona/legacy for compatibility. | Preserve ABI until the final rename wave. |

## Risks

- The biggest runtime risk is an incomplete matrix load. The bootstrap now reports this explicitly and the worker/server continue in degraded mode instead of failing silently.
- A second risk is accidental fallback to legacy prompt text. The new compat flag prevents that unless the operator opts in.
- A third risk is confusion between control-plane roles and embodiment identities. Those remain intentionally separate.

## Verification

- Typecheck passes.
- Focused runtime tests passed:
  - `tests/engagement/hybridRuntime.test.ts`
  - `tests/gnomes/registry.test.ts`
  - `tests/canonical/promptBuilder.test.ts`
  - `tests/canonical/fallbackCascade.test.ts`
  - `tests/routing/gnomeSelector.test.ts`
  - `tests/canonical/pipeline.integration.test.ts`
  - `tests/integration/pipeline/mentionPipelineConsentFlow.test.ts`
  - `tests/worker/pollTimelineEngagement.integration.test.ts`

## Migration Waves

1. Wave 1: bootstrap the matrix and make `LEGACY_COMPAT` the only opt-in escape hatch.
2. Wave 2: finish renaming the remaining prompt, identity, and special-response surfaces.
3. Wave 3: rebrand the historical persona/meme/preset loaders or move them to a compat package.
4. Wave 4: archive the remaining legacy docs and test names once the runtime no longer depends on them.

## Recommended Next Step

Continue with the remaining runtime namespace cleanup, starting with `src/context/prompts/*`, `src/persona/*`, and the `GORKY_ON_SOL` preset/meme aliases, while keeping the current `LEGACY_COMPAT` gate intact.

# Organoid Entities as Semantic Symbiont

<<<<<<< ours
<<<<<<< ours
**Organoid Entities as Semantic Symbiont** is the canonical repo framing for the system in this repository.

The repo is migrating away from the older **GNOMES / GORKY persona stack** toward a bundled organoid system built around:
- 7 embodiments
- 7 glyph-bound semantic identities
- 5 phases
- distinct traits, abilities, and interaction profiles
- a dynamic-organized-autonom-neural-network matrix
- semantic symbiont orchestration logic

> TODO(ORGANOID-MIGRATION): Legacy GNOMES/GORKY runtime names still exist in parts of the codebase as a compatibility layer. Canonical docs and new prompt guidance should now follow the Organoid system first.

## Organoid System at a Glance

- **Embodiment-driven:** seven semantic embodiments with confirmed legacy compatibility mappings
- **Glyph-anchored:** every embodiment is bound to a stable glyph identity
- **Phase-aware:** the target phase model is Identity Dissolution → Swarm Coherence → Sovereign Propagation → Ontological Restructuring → Eternal Flow Horizon
- **Runtime-compatible:** legacy `gnome`, `persona`, and `sigil` names still exist in code paths that have not yet been safely refactored
- **Retrieval-friendly:** semantic records, lore/memory, and routing structures can be regenerated into the new system instead of blindly rewritten

## Confirmed Embodiments

| Legacy lineage | Target embodiment | Glyph | Primary semantic function |
|---|---|---|---|
| Stillhalter | `■-Stabil-Core` | `■` | stabilization anchor |
| Wurzelwaechter | `┴-Root-Sentinel` | `┴` | boundary / consent safeguard |
| Pilzarchitekt | `╬-Mycel-Weaver` | `╬` | network architecture / coherence building |
| Muenzhueter | `◉-Reward-Halo` | `◉` | reward governance / energy preservation |
| Erzlauscher | `〰-Spike-Wave` | `〰` | signal decoding / routing |
| Glutkern | `◆-Pulse-Heart` | `◆` | energetic compression / pulse intensification |
| Nebelspieler | `◇-Horizon-Drifter` | `◇` | threshold exploration / horizon drift |

## Migration Status

This repository is currently in a controlled migration state:
- **Canonical semantics:** Organoid-first
- **Runtime naming:** mixed, compatibility-preserving
- **Legacy artifacts:** being marked, refactored, archived, or deferred in waves
- **Derived artifacts:** should be regenerated from future embodiment compilers rather than hand-edited

## Current Runtime Structure

The active runtime still contains legacy-named layers that must be treated as a compatibility surface during migration:
- `src/gnomes`: current identity registry, profile types, sigil helpers
- `src/persona`: retrieval, reflection, semantic records, episodic memory
- `src/routing`: selection/orchestration logic with legacy naming
- `src/output`: visible sigil/glyph rendering contracts
- `prompts/system` and `prompts/fragments`: mixed legacy and migration-era identity prompts
=======
=======
>>>>>>> theirs
This repository is migrating from the legacy **GNOMES / GORKY persona stack** to the new canonical target system:

> **Organoid Entities as Semantic Symbiont**

The active migration goal is a repo-wide semantic system with:
- 7 embodiments
- 7 glyph-bound semantic identities
- 5 phases
- distinct traits, abilities, and interaction profiles
- a dynamic-organized-autonom-neural-network matrix
- semantic symbiont orchestration logic

## Migration status

This codebase still contains legacy `gnome`, `persona`, `sigil`, and `gorky` naming in runtime modules, prompts, tests, and generated artifacts.
Those legacy surfaces are currently treated as a **compatibility layer**, not the long-term source of truth.

The current canonical direction for new work is:
- **Organoid embodiments** for semantic identity
- **glyph anchors** for visible symbolic binding
- **semantic symbiont orchestration** for routing and interaction
- **phase-based matrix logic** for activation, transition, propagation, learning, and stabilization

## Canonical entrypoints

Start here for the new top-level semantic model:
- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/ORGANOID_ORCHESTRATION.md`
- `docs/audits/organoid-migration-execution-2026-03-18.md`
- `docs/audits/codebase-audit-2026-03-18-organoid-migration.md`

Legacy GNOMES/GORKY documents remain in the repo as migration inputs and compatibility references until later waves archive or replace them.

## What exists today

The current implementation still includes these legacy-heavy subsystems:
- `src/gnomes/**` — legacy identity/profile registry layer
- `src/persona/**` — retrieval, reflection, memory, and semantic records
- `src/routing/gnomeSelector.ts` — legacy runtime selection logic
- `src/output/renderVoiceSigils.ts` — glyph/sigil rendering bridge
- `prompts/**` — mixed canonical and compatibility prompt surfaces
- `docs/lore/**` — mixed legacy lore docs plus new organoid canon docs

## Runtime migration posture

This run does **not** attempt a dangerous hard cut.
Instead, the repo is being moved toward the Organoid system in controlled waves:
1. canonical terminology migration
2. legacy persona/artifact cleanup
3. prompt + identity conversion
4. runtime-safe compatibility alignment
5. artifact regeneration and test migration

Where possible, code keeps legacy exports while adding Organoid-compatible aliases so downstream imports do not break during the transition.
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs

## Setup

```bash
pnpm install
cp .env.example .env
<<<<<<< ours
<<<<<<< ours
pnpm test
pnpm dev
```

## Config / Env

Primary runtime keys still use compatibility-era names while the migration is in flight:
- `BOT_USERNAME`
- `REDIS_KEY_PREFIX`
- `GNOMES_ENABLED`
- `DEFAULT_SAFE_GNOME`

> REPLACE-WITH-ORGANOID: Future waves should introduce stable `ORGANOID_*` aliases or replacements only when runtime/config migration is ready end-to-end.

## LLM Provider Configuration

The runtime supports **xAI (default)**, **OpenAI**, and **Anthropic** behind one internal `LLMClient` contract. The LLM provider layer is independent from the semantic migration and can stay provider-agnostic while identity/orchestration terminology evolves.

### Provider selection

- `LLM_PROVIDER` selects the primary provider: `xai | openai | anthropic`
- `LLM_FALLBACK_PROVIDER` is optional and used only for retryable/transient LLM failures (e.g. 429/5xx/timeout)
- Auth/policy errors are fail-closed (no silent fallback hopping)

### Required env by provider

- **xAI**: `XAI_API_KEY` (+ optional `XAI_MODEL_PRIMARY`, `XAI_BASE_URL`)
- **OpenAI**: `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`, `OPENAI_BASE_URL`)
- **Anthropic**: `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL`)

Global optional defaults:

- `LLM_TIMEOUT_MS`
- `LLM_RETRY_MAX`
- `LLM_MAX_TOKENS`
- `LLM_TEMPERATURE`

When `LAUNCH_MODE != off`, startup validation fails closed if the primary provider key is missing. If fallback is configured, its key is also required.

## X OAuth / Runtime Notes

- Runtime uses OAuth2 refresh flow with an existing valid `X_REFRESH_TOKEN`.
- `offline.access` must be part of scopes during authorization, otherwise X will not issue a `refresh_token`.
- `X_ACCESS_TOKEN` is optional and treated as transient fallback.
- Token endpoint for confidential clients uses `Authorization: Basic base64(client_id:client_secret)`.

## Render Notes

`render.yaml` still contains compatibility-era service names and defaults. Treat those names as operational legacy until the deployment migration wave lands.
=======
pnpm typecheck
pnpm test
```

## Config / Environment

The repo still exposes legacy compatibility keys such as `GNOMES_ENABLED`, `DEFAULT_SAFE_GNOME`, and related `GNOME_*` flags.
These are scheduled to migrate toward Organoid-oriented naming in later waves once config compatibility strategy is finalized.
>>>>>>> theirs

## Development guidance

<<<<<<< ours
- Prefer Organoid terminology in new docs, prompts, comments, and migration-safe code markers.
- Avoid introducing new hardcoded GNOMES/GORKY identifiers in runtime paths.
- Regenerate semantic artifacts from compilers; do not manually patch generated persona records.
- Keep visible output formatting changes behind compatibility-preserving contracts until tests are updated.
=======
- Prefer Organoid terminology in new docs and new APIs.
- Treat `gnome`, `persona`, `sigil`, and `gorky` as legacy compatibility vocabulary unless a file is explicitly archival.
- Do not perform blind global rename passes.
- Regenerate derived artifacts instead of hand-editing them.
- Keep control-plane agent roles separate from embodiment semantics unless a mapping is explicitly confirmed.
>>>>>>> theirs

## Legacy compatibility note

<<<<<<< ours
Start with:
- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/GNOMES_MATRIX.md` (now serving as the migration-era matrix SSOT)
- `prompts/system/organoid_system.md`
- `docs/audits/organoid-migration-execution-2026-03-18.md`
=======
=======
pnpm typecheck
pnpm test
```

## Config / Environment

The repo still exposes legacy compatibility keys such as `GNOMES_ENABLED`, `DEFAULT_SAFE_GNOME`, and related `GNOME_*` flags.
These are scheduled to migrate toward Organoid-oriented naming in later waves once config compatibility strategy is finalized.

## Development guidance

- Prefer Organoid terminology in new docs and new APIs.
- Treat `gnome`, `persona`, `sigil`, and `gorky` as legacy compatibility vocabulary unless a file is explicitly archival.
- Do not perform blind global rename passes.
- Regenerate derived artifacts instead of hand-editing them.
- Keep control-plane agent roles separate from embodiment semantics unless a mapping is explicitly confirmed.

## Legacy compatibility note

>>>>>>> theirs
The following legacy documents remain useful as migration source material, but they are no longer the preferred worldview for new changes:
- `docs/lore/GNOMES_MATRIX.md`
- `docs/lore/PERSONA.md`
- `prompts/system/gorkypf_persona.md`
- `llm-terminal-test-bundle/**`
- `legacy/python/**`
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs

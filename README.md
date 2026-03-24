# Organoid Entities as Semantic Symbiont

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

## Mental Model

The system is easiest to understand as a living loop: organoids act, glyphs show their state, and the observer feeds the drift back into the next beat.

| Layer | What it feels like | What it does |
| --- | --- | --- |
| Organoid entities | Active tissue | Carries identity, role, and phase affinity through the matrix |
| Glyph anchors | Visible membranes | Render the current organoid shape in terminal, SVG, and overlay surfaces |
| Five-phase state | Metabolic rhythm | Moves the system through activation, transition, propagation, learning, and stabilization |
| Signal and resonance | Electrical shimmer | Modulate the glyph so it subtly fractures, grows, or settles based on live pressure |
| Pulse-Heart | Self-correcting pulse | Observes every interaction, records drift, and nudges the system back toward coherence |
| Output paths | Secretion channels | Carry the same state into renderers, server responses, and X autopost events |

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

## Setup

```bash
pnpm install
cp .env.example .env
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

The following legacy documents remain useful as migration source material, but they are no longer the preferred worldview for new changes:
- `docs/lore/GNOMES_MATRIX.md`
- `docs/lore/PERSONA.md`
- `prompts/system/gorkypf_persona.md`
- `llm-terminal-test-bundle/**`
- `legacy/python/**`

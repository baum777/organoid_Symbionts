<<<<<<< ours
<<<<<<< ours
# Organoid Migration Execution — 2026-03-18

## Run Title

**Organoid Migration Wave 1 — Canonical Terminology + Legacy Persona Cleanup**

## Goal of This Run

Execute the first real migration wave after the audit by:
- validating the prior audit against the live repo,
- moving the canonical semantic surface to the Organoid system,
- adding runtime-safe migration markers in high-leverage code paths,
- cleaning up or reframing legacy canonical files without unsafe runtime rewrites,
- documenting what was changed, why it was safe, and what remains deferred.

## Phase A — Baseline Validation

### Confirmed audit alignment
- The repo still shows large-scale legacy coverage across README, lore docs, prompts, runtime identity layers, tests, schemas, and archived bundles.
- `README.md`, `docs/lore/PERSONA.md`, `docs/lore/GNOMES_MATRIX.md`, and `prompts/system/gorkypf_persona.md` remained dominant legacy semantic surfaces before this run.
- Runtime-safe but semantically critical code surfaces still include `src/gnomes/**`, `src/config/gnomesConfig.ts`, `src/routing/gnomeSelector.ts`, `src/prompts/composeGnomePrompt.ts`, `src/output/renderVoiceSigils.ts`, `src/types/agentRouter.ts`, and `src/router/permissions.ts`.

### Deviations from the prior audit
- No major audit contradiction was found in the validated P0/P1 files touched during this wave.
- The most actionable hidden legacy artifact remained `src/ensemble/characterInteractionGraph.ts` (`spark/gorky/moss`), but it was left for a later runtime-focused wave instead of partially rewriting relationships without a new source graph.

### Execution scope for this run
- P0: canonical docs, entry docs, prompt identity surface, migration reports
- P1: runtime-safe code comments/markers only
- Deferred: structural runtime renames, generated artifact regeneration, test/snapshot rewrites, deep legacy bundle archival

## Phase B — Canonical Terminology Migration

### Files changed
- `README.md`
- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/PERSONA.md`
- `docs/lore/GNOMES_MATRIX.md`
- `docs/lore/README.md`
- `docs/reference/README.md`
- `docs/reference/prompts/system-prompts.md`
- `prompts/system/organoid_system.md`
- `prompts/system/gorkypf_persona.md`
- `docs/reference/WHITEPAPER_PRODUCTION_AGENT_PLATFORM.md`
- `src/ensemble/characterInteractionGraph.ts`

### Result
- The repo entrypoint now frames the system as **Organoid Entities as Semantic Symbiont**.
- The canonical identity docs are now embodiment-first.
- The old `PERSONA.md` and `GNOMES_MATRIX.md` paths remain stable for link compatibility, but their semantic authority has been migrated to Organoid terminology.
- A canonical Organoid system prompt file now exists.
- The legacy GORKY prompt file is explicitly downgraded to a compatibility artifact.

## Phase C — Legacy Persona / Artifact Cleanup

### Cleanup actions performed
- Added explicit legacy/migration banners to canonical docs and the compatibility-era GORKY prompt.
- Reframed `docs/reference/README.md` so GNOMES bundle material is clearly historical/legacy compared with the organoid target references.
- Preserved file paths where link stability matters, but changed semantic authority inside the files.

### Cleanup actions intentionally deferred
- Archiving `llm-terminal-test-bundle/**`
- Archiving `legacy/python/**`
- Removing `prompts/fragments/gnomes/gorky.md`
- Rewriting `tests/gorkypf/**`, `tests/stress/**`, and snapshots
- Replacing generated `artifacts/persona-semantic-records*.json`

## Phase D — Prompt / Identity / Orchestration Preparation

### Runtime-safe markers added
- `src/gnomes/types.ts`
- `src/config/gnomesConfig.ts`
- `src/routing/gnomeSelector.ts`
- `src/prompts/composeGnomePrompt.ts`
- `src/output/renderVoiceSigils.ts`
- `src/types/agentRouter.ts`
- `src/router/permissions.ts`

### Why marker-only here?
These files are runtime-adjacent and high leverage. Marker comments advance migration clarity without forcing unsafe identifier renames or breaking imports/tests before the deeper refactor wave.

## Mapping Decisions

### Confirmed
=======
=======
>>>>>>> theirs
# Organoid Migration Wave 1 — Canonical Terminology + Legacy Persona Cleanup

## Run goal

Execute the first controlled migration wave using the existing audit as input, with real file changes but minimal runtime breakage.

## Baseline validation

Validated against the live repo before editing:
- The key legacy clusters identified in the audit are present and still dominant in `README.md`, `docs/lore/*`, `prompts/system/gorkypf_persona.md`, `prompts/fragments/gnomes/gorky.md`, `src/gnomes/*`, `src/routing/gnomeSelector.ts`, `src/output/renderVoiceSigils.ts`, `src/config/gnomesConfig.ts`, and `package.json`.
- The organoid target sources still exist in `organoid-matrixv1.md` and `update/grok-organoid-full-introduction.txt`.
- No audit blocker was found that prevented a P0/P1-safe terminology migration.

## Execution scope for this run

### Wave 1A — Canonical docs and entrypoints
**Risk:** low  
**Goal:** make the repo visibly Organoid-led without breaking runtime.

Touched:
- `README.md`
- `docs/lore/README.md`
- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/ORGANOID_ORCHESTRATION.md`
- `docs/lore/PERSONA.md`
- `docs/lore/GNOMES_MATRIX.md`

### Wave 1B — Prompt/identity compatibility reframing
**Risk:** low to medium  
**Goal:** stop GORKY from remaining the unmarked canonical identity surface.

Touched:
- `prompts/system/gorkypf_persona.md`
- `prompts/fragments/gnomes/gorky.md`

### Wave 1C — Runtime-safe compatibility aliases
**Risk:** medium  
**Goal:** add Organoid-compatible naming without breaking legacy imports.

Touched:
- `src/gnomes/types.ts`
- `src/gnomes/registry.ts`
- `src/config/gnomesConfig.ts`
- `src/routing/gnomeSelector.ts`
- `src/output/renderVoiceSigils.ts`
- `package.json`

## Confirmed / probable / unsure mappings used in this run

### CONFIRMED
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
- Stillhalter → `■-Stabil-Core`
- Wurzelwaechter → `┴-Root-Sentinel`
- Pilzarchitekt → `╬-Mycel-Weaver`
- Muenzhueter → `◉-Reward-Halo`
- Erzlauscher → `〰-Spike-Wave`
- Glutkern → `◆-Pulse-Heart`
- Nebelspieler → `◇-Horizon-Drifter`
<<<<<<< ours
<<<<<<< ours
- Phase model: Identity Dissolution / Swarm Coherence / Sovereign Propagation / Ontological Restructuring / Eternal Flow Horizon

### Probable
- Existing swarm/world/faction/ritual concepts will likely become matrix propagation/adaptation overlays rather than identity systems.

### Unsure
- GORKY as a single persona does not have a confirmed 1:1 embodiment mapping.
- Agent-router roles remain a separate control-plane model until explicitly redesigned.

## Decision Log

| File | Why touched | What changed | Why safe | Follow-up |
|---|---|---|---|---|
| `README.md` | public semantic authority | Organoid-first framing, compatibility notes, confirmed embodiment table | docs-only | later update env/runtime naming after compat plan |
| `docs/lore/ORGANOID_EMBODIMENTS.md` | new canonical identity surface | added confirmed embodiment/glyph/phase mapping | docs-only | extend with abilities/interactions as runtime matures |
| `docs/lore/PERSONA.md` | keep stable path while changing semantics | converted to compatibility matrix | docs-only | later rename path if link stability no longer needed |
| `docs/lore/GNOMES_MATRIX.md` | highest-value old matrix SSOT | converted content to Organoid matrix while keeping filename | docs-only | later consider renaming file path |
| `docs/lore/README.md` | lore entrypoint | Organoid-first framing | docs-only | update remaining lore docs later |
| `docs/reference/README.md` | reference entrypoint | reclassified organoid vs legacy bundle sources | docs-only | migrate whitepaper later |
| `docs/reference/prompts/system-prompts.md` | prompt index | promoted `organoid_system.md`, demoted `gorkypf_persona.md` | docs-only | update other prompt docs later |
| `prompts/system/organoid_system.md` | canonical prompt source missing | added Organoid system prompt surface | additive, no references broken | later integrate into loaders/composers |
| `prompts/system/gorkypf_persona.md` | old canonical prompt still dominant | added compatibility/deprecation banner | preserves body, low risk | later split into embodiment prompts |
| `docs/reference/WHITEPAPER_PRODUCTION_AGENT_PLATFORM.md` | architecture/background doc still agent-centric | added legacy banner and migration note | docs-only | later rewrite around symbiont orchestration |
| `src/ensemble/characterInteractionGraph.ts` | hidden older character lineage still present | added runtime-safe migration marker only | comment-only, no logic changes | replace source graph in wave 2 |
| runtime comment-marked files | prepare safe refactor wave | added TODO/migration comments only | comment-only, no logic changes | deep refactor in wave 2 |

## Open Risks
- Runtime code still uses legacy names pervasively.
- Existing tests and snapshots still reinforce GORKY/GNOMES semantics.
- Generated artifacts still reflect legacy embodiment vocabulary.
- The control-plane agent model still needs explicit separation from embodiment semantics in future docs/code.

## Next Actions
1. Introduce compatibility-safe Organoid registry/profile abstractions.
2. Migrate prompt fragments from `prompts/fragments/gnomes/*.md` to an Organoid-first fragment set.
3. Refactor visible output contracts from `sigil` to `glyph` in code/tests without breaking render behavior.
4. Handle `src/ensemble/characterInteractionGraph.ts` and other hidden character remnants.
5. Regenerate semantic records and update tests/snapshots.

## Next-Run Stub

```text
Continue Organoid Migration Wave 2.

Use `docs/audits/organoid-migration-execution-2026-03-18.md` as the current execution baseline.

Focus on runtime-safe identity/orchestration migration:
- introduce Organoid-first registry/profile abstractions with compatibility aliases,
- migrate prompt fragments from GNOMES/GORKY to embodiment fragments,
- refactor output/render naming from sigils to glyphs,
- replace hidden character remnants such as `spark/gorky/moss`,
- regenerate semantic records and update affected tests/snapshots.

Rules:
- no blind global replacement,
- preserve runtime behavior where possible,
- mark CONFIRMED / PROBABLE / UNSURE mappings explicitly,
- prefer compatibility layers over breaking hard cuts.
=======
=======
>>>>>>> theirs
- Phase set:
  - Identity Dissolution
  - Swarm Coherence
  - Sovereign Propagation
  - Ontological Restructuring
  - Eternal Flow Horizon

### PROBABLE
- Existing swarm/world/faction/ritual layers can be reinterpreted as propagation/adaptation overlays.
- Existing persona/retrieval/memory layers can become semantic symbiont memory and orchestration layers.

### UNSURE
- Direct 1:1 mapping of GORKY to a single embodiment.
- Direct mapping of control-plane agent roles to embodiments.
- Full env/config hard cut from `GNOME_*` to `ORGANOID_*` in the same wave.

## Decision log by touched file

| File | Why touched | What changed | Why safe | Follow-up |
|---|---|---|---|---|
| `README.md` | repo frontdoor still taught the legacy worldview | rewrote intro around Organoid canonical direction and compatibility posture | docs only | later update examples and package naming references if more hard cuts happen |
| `docs/lore/README.md` | lore entrypoint still treated GNOMES as active canon | split canonical Organoid docs from legacy transition docs | docs only | continue moving consumers to Organoid docs |
| `docs/lore/ORGANOID_EMBODIMENTS.md` | missing clean SSOT for 7 embodiments | added canonical embodiment file | docs only | later expand with runtime profile schema |
| `docs/lore/ORGANOID_ORCHESTRATION.md` | missing clean SSOT for phases/orchestration | added canonical orchestration file | docs only | later connect runtime modules to this vocabulary |
| `docs/lore/PERSONA.md` | old persona doc remained authoritative | converted into transition reference with confirmed mapping table | docs only | later archive or fold into historical appendix |
| `docs/lore/GNOMES_MATRIX.md` | old matrix doc remained authoritative | converted into transition reference with replacement direction | docs only | later archive after runtime migration |
| `prompts/system/gorkypf_persona.md` | unmarked legacy prompt acted as canonical identity | reframed as legacy compatibility prompt and added migration guidance | markdown prompt text only, no schema/JSON breakage | later replace with embodiment-specific system prompt |
| `prompts/fragments/gnomes/gorky.md` | mixed GORKY fragment still lived in active prompt tree | marked as compatibility fragment with TODO | markdown only | later delete/replace |
| `src/gnomes/types.ts` | central identity naming registry still legacy-only | added Organoid-compatible type aliases and migration comments | additive aliases only | later rename underlying structures |
| `src/gnomes/registry.ts` | runtime registry had only legacy names | added alias exports for embodiment naming | additive exports only | later migrate imports |
| `src/config/gnomesConfig.ts` | config layer still exposed only legacy naming | added Organoid-compatible type and getter aliases | additive aliases only | later introduce env alias/compat plan |
| `src/routing/gnomeSelector.ts` | selector still encoded only legacy type names | added embodiment selection aliases | additive alias export only | later deeper selector refactor |
| `src/output/renderVoiceSigils.ts` | output layer still exposed only voice/sigil naming | added embodiment/glyph aliases | additive export only | later migrate consumer names |
| `package.json` | top-level package identity was still `gnomes-bot` | renamed package to `organoid-symbiont` | package metadata only | observe if any external tooling depends on old name |

## Cleanup actions executed

### REFACTOR
- `README.md`
- `docs/lore/README.md`
- `docs/lore/PERSONA.md`
- `docs/lore/GNOMES_MATRIX.md`
- `prompts/system/gorkypf_persona.md`
- `prompts/fragments/gnomes/gorky.md`
- `src/gnomes/types.ts`
- `src/gnomes/registry.ts`
- `src/config/gnomesConfig.ts`
- `src/routing/gnomeSelector.ts`
- `src/output/renderVoiceSigils.ts`
- `package.json`

### ADD
- `docs/lore/ORGANOID_EMBODIMENTS.md`
- `docs/lore/ORGANOID_ORCHESTRATION.md`
- `docs/audits/organoid-migration-execution-2026-03-18.md`

### DEFER
- deep runtime renames
- env key hard cut
- generated artifact regeneration
- snapshot/test-wide wording replacement
- archive moves for large legacy bundles

## Open risks after this run

- Runtime code still uses legacy filenames and many legacy identifiers.
- Tests and generated artifacts still preserve GNOMES/GORKY wording in large numbers.
- Package rename is metadata-safe but should be watched for tooling assumptions.
- Prompt compatibility surfaces are now clearly marked, but not yet replaced.

## Next actions

1. Convert prompt fragment sets from legacy gnome identities to embodiment-specific fragments.
2. Introduce a formal `OrganoidEmbodimentProfile` schema and start migrating imports.
3. Add config/env compatibility plan for `GNOME_*` → `ORGANOID_*`.
4. Refactor tests and generated artifacts to stop reintroducing legacy semantics.
5. Decide the final relationship between control-plane agent roles and embodiment orchestration.

## Next-run stub

Use this exact follow-up:

```text
Execute Organoid Migration Wave 2.

Use `docs/audits/organoid-migration-execution-2026-03-18.md` and `docs/lore/ORGANOID_EMBODIMENTS.md` as the active migration baseline.

Goals:
1. Replace active prompt fragment and prompt system surfaces with embodiment-specific Organoid prompt assets.
2. Introduce a first-class `OrganoidEmbodimentProfile` schema/module and begin moving runtime imports from legacy gnome naming to embodiment naming.
3. Migrate high-signal tests and generated semantic artifacts so they stop reasserting GNOMES/GORKY semantics.
4. Keep changes backward-compatible where runtime breakage risk is non-trivial.
5. Mark any remaining direct GORKY or GNOMES authority surfaces as legacy or archive them when safe.

Do not do a blind global rename.
Use CONFIRMED / PROBABLE / UNSURE mapping labels when needed.
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
```

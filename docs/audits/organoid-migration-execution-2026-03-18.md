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
- Stillhalter → `■-Stabil-Core`
- Wurzelwaechter → `┴-Root-Sentinel`
- Pilzarchitekt → `╬-Mycel-Weaver`
- Muenzhueter → `◉-Reward-Halo`
- Erzlauscher → `〰-Spike-Wave`
- Glutkern → `◆-Pulse-Heart`
- Nebelspieler → `◇-Horizon-Drifter`
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
```

# Organoid Migration Execution — 2026-03-18 Wave 2

## Goal / Scope

Wave 2 targets runtime-safe identity, registry, prompt-fragment, and visible output migration.

Priority order executed in this run:
1. P0 runtime identity/profile surfaces
2. P0 prompt fragments and shared prompt canon
3. P0 visible output naming (`sigil` → `glyph`) with compatibility aliases
4. P1 hidden legacy relation/event remnants and high-signal tests
5. P2 artifact/legacy reinfection markers only where regeneration was not fully safe in this run

## Validated Baseline

### Confirmed baseline from Wave 1
- Wave 1 successfully moved docs and migration commentary to Organoid-first semantics.
- Runtime still depended on `src/gnomes/*`, `prompts/fragments/gnomes/*`, and `src/output/renderVoiceSigils.ts` as compatibility-era surfaces.
- `data/gnomes/*.yaml` was still missing, which meant runtime/test paths expecting real registry profiles had no canonical source files.

### Real execution scope for this run
- **CONFIRMED:** runtime profile schema and registry could be upgraded additively without breaking import paths.
- **CONFIRMED:** prompt fragment composition could prefer embodiment fragments first while preserving legacy gnome fragment fallback.
- **CONFIRMED:** visible output naming could begin migrating to glyph-first via aliases.
- **PROBABLE:** relation/event remnants could be safely moved from `spark/gorky/moss` to approved gnome relations derived from existing semantic artifacts.
- **UNSURE:** broader GORKY-only prompt/system surfaces outside the gnome composer remain compatibility-heavy and were not deeply rewritten in this wave.

## Files Touched

### Runtime identity / registry / profile layer
- `src/gnomes/types.ts`
- `src/gnomes/registry.ts`
- `src/gnomes/sigils.ts`
- `src/gnomes/loadGnomes.ts`
- `data/gnomes/*.yaml`

### Prompt fragments / composition
- `src/prompts/promptFragments.ts`
- `src/prompts/composeGnomePrompt.ts`
- `prompts/fragments/sharedOrganoidCanon.md`
- `prompts/fragments/embodiments/*.md`
- `prompts/fragments/gnomes/gorky.md`

### Visible output naming
- `src/output/renderVoiceSigils.ts`
- `tests/_helpers/voiceSigils.ts`
- `tests/output/renderVoiceSigils.test.ts`

### Hidden legacy remnants / runtime markers
- `src/ensemble/characterInteractionGraph.ts`
- `src/events/worldEventRegistry.ts`

### High-signal tests
- `tests/gnomes/registry.test.ts`
- `tests/persona/personaCompiler.test.ts`

## Changes Executed

### 1) Organoid-first runtime abstraction introduced
- Added additive embodiment/glyph fields to the compatibility `GnomeProfile` schema.
- Introduced `OrganoidEmbodimentProfile`, `OrganoidPhase`, `getProfileGlyph`, `getProfileEmbodiment`, and `isOrganoidEmbodimentProfile`.
- Upgraded the registry to resolve by legacy id **and** embodiment label, plus expose organoid-first lookup helpers.
- Reintroduced canonical runtime profile YAMLs in `data/gnomes/*.yaml` so the registry/profile layer now has a real SSOT-backed runtime source again.

### 2) Prompt fragments migrated to embodiment-first activation
- Added `prompts/fragments/sharedOrganoidCanon.md` as the preferred shared prompt canon.
- Added one active embodiment fragment per confirmed organoid embodiment.
- Changed fragment loading to prefer `embodiments/*.md`, then fallback to legacy `gnomes/*.md`, then `persona_fragment`.
- Upgraded composed prompts to state both runtime identity and embodiment/glyph anchor, reducing duplicate semantic truth.
- Marked `prompts/fragments/gnomes/gorky.md` as explicit legacy compatibility.

### 3) Output terminology migration started safely
- Added glyph-first renderer/export names in `src/output/renderVoiceSigils.ts`.
- Preserved the file path and `renderVoiceSigils` export as compatibility aliases.
- Switched marker handling to recognize both legacy `--voice-sigils--` and preferred `--voice-glyphs--`.

### 4) Hidden legacy relation remnants addressed
- Replaced `spark/gorky/moss` graph defaults with approved gnome relation pairs already reflected in semantic records.
- Updated world event affected voice lists away from hidden persona remnants to active gnome ids.
- Did **not** invent a new large relation ontology; only moved to runtime-safe, artifact-backed pairings.

### 5) Test / artifact preparation
- Updated high-signal registry/persona/output tests to accept embodiment/glyph semantics and real data-backed profiles.
- `artifacts/persona-semantic-records*.json` were **not regenerated** in this wave.
- Those artifacts remain a **LEGACY-ARTIFACT** reinfection source because they still describe `derivedFrom: data/gnomes/*.yaml` generated content but were not refreshed after the YAML/profile rewrite.

## Mapping Status

### CONFIRMED
- Legacy runtime ids map to the seven embodiments documented in `docs/lore/ORGANOID_EMBODIMENTS.md`.
- Glyph anchors are now stored in runtime profile YAMLs and surfaced through registry/prompt/output helpers.
- Existing relation hints in semantic artifacts support at least these runtime-safe pairings:
  - stillhalter ↔ nebelspieler / pilzarchitekt / muenzhueter / wurzelwaechter / erzlauscher
  - glutkern ↔ nebelspieler / wurzelwaechter / erzlauscher
  - pilzarchitekt ↔ erzlauscher / muenzhueter

### PROBABLE
- The selected world-event affected voices are semantically aligned with the approved embodiment roles, but the event taxonomy itself is still pre-organoid and may need redesign in a later wave.
- Some archetype categories remain legacy taxonomic buckets even though the active prompt/runtime layer is now embodiment-first.

### UNSURE
- The exact long-term replacement for the `GnomeProfile`/`gnome` type/file naming surface remains open.
- GORKY-only prompt and canonical pipelines outside the gnome composer still need a broader compatibility plan.
- `phase_affinities` are additive runtime hints derived from the SSOT matrix, not yet a deeply enforced runtime control surface.

## Cleanup Decisions

| Surface | Decision | Rationale |
|---|---|---|
| `src/gnomes/*` file path | KEEP | stable import path needed during compatibility window |
| `GnomeProfile` naming | REFACTOR | additive organoid aliases introduced; hard rename deferred |
| `prompts/fragments/gnomes/gorky.md` | KEEP | compatibility-only, now explicitly marked legacy |
| `prompts/fragments/embodiments/*.md` | MERGE | active semantics moved here while preserving legacy fallback |
| `data/gnomes/*.yaml` | MERGE | runtime source restored and enriched with embodiment/glyph fields |
| `src/output/renderVoiceSigils.ts` | REFACTOR | glyph-first exports added without breaking import path |
| `src/ensemble/characterInteractionGraph.ts` legacy remnant graph | REFACTOR | replaced hidden persona remnants with artifact-backed gnome relations |
| `artifacts/persona-semantic-records*.json` | DEFER | regeneration left for later safe artifact wave |
| broader GORKY-only prompt/system bundle | DEFER | not safe to rewrite deeply in this wave |

## Risks

1. **LEGACY-ARTIFACT:** semantic record artifacts were not regenerated and can still reintroduce stale wording.
2. **LEGACY-PERSONA:** broader `src/canonical/*`, `src/persona/*`, and stress/test surfaces still contain GORKY/persona language.
3. **PHASE-MAPPING-NEEDED:** runtime `phase_affinities` are additive metadata only, not yet enforcement logic.
4. **GLYPH-MAPPING-NEEDED:** some file names and test names still say `sigils` for compatibility.
5. **ABILITY-MAPPING-NEEDED:** unique embodiment abilities remain documented canonically but are not yet separate runtime selectors.

## Follow-ups

1. Regenerate `artifacts/persona-semantic-records*.json` from the new YAML profile SSOT and mark any diff-driven retrieval behavior changes.
2. Extend selector/router/composer scoring so embodiment/phase metadata influences selection directly.
3. Continue visible naming migration in output helpers, selectors, and renderers while keeping alias exports.
4. Audit `src/canonical/*` and `src/persona/*` for high-visibility GORKY-only system text.
5. Revisit world/faction/ritual/event taxonomies so they reflect matrix/phase semantics instead of legacy ensemble lore.

## Next-run Stub

```text
Continue Organoid Migration Wave 3.

Use `docs/audits/organoid-migration-execution-2026-03-18-wave2.md` as the active baseline.

Focus on selector/router/retrieval deepening:
- make embodiment/glyph/phase metadata influence selection and routing directly,
- regenerate persona semantic artifacts from the new runtime YAML SSOT,
- migrate remaining visible output/helper naming from sigil to glyph where runtime-safe,
- audit `src/canonical/*` and `src/persona/*` for GORKY-only prompt/guardrail text,
- classify remaining legacy artifacts as KEEP / REFACTOR / ARCHIVE / DELETE / DEFER.

Rules:
- no blind global rename,
- keep compatibility aliases where imports/output contracts are still live,
- mark CONFIRMED / PROBABLE / UNSURE explicitly,
- do not invent new graph logic without artifact or SSOT support.
```

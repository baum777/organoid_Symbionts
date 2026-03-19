# Organoid Migration Wave 2 — Embodiment Assets + Runtime Seed Alignment

## Goal of this run

Execute the next migration step after Wave 1 by introducing real embodiment-backed assets and making the runtime/prompt/test surface use them without a risky hard cut.

## What was validated first

- The Wave 1 docs exist and remain the active semantic baseline.
- `loadGnomes()` still read from `data/gnomes/*.yaml`, but the repo had no `data/gnomes` directory yet.
- Prompt composition still resolved only `prompts/fragments/gnomes/*.md`.
- Registry-related tests were failing because no YAML profiles existed.

## Waves executed

### Wave 2A — Runtime seed data for the 7 embodiments
**Risk:** medium  
**Files:** `data/gnomes/*.yaml`

Actions:
- added seven compatibility YAML profiles using legacy ids but Organoid-led names and glyphs
- ensured each profile contains semantic facets, style anchors, negative anchors, safety boundaries, and relation hints
- kept ids stable (`stillhalter`, `wurzelwaechter`, etc.) to avoid import breakage

### Wave 2B — Canonical embodiment prompt fragments
**Risk:** low  
**Files:** `prompts/fragments/organoids/*.md`, `src/prompts/promptFragments.ts`, `src/prompts/composeGnomePrompt.ts`

Actions:
- added embodiment-native prompt fragments for all seven compatibility ids
- taught the prompt fragment loader to prefer `organoids/<id>.md` and only then fall back to `gnomes/<id>.md`
- added `composeEmbodimentPrompt` alias while preserving `composeGnomePrompt`

### Wave 2C — Additional runtime-safe compatibility aliases
**Risk:** low to medium  
**Files:** `src/gnomes/loadGnomes.ts`, `src/gnomes/sigils.ts`

Actions:
- added `loadEmbodiments()` alias on top of `loadGnomes()`
- added glyph-oriented helpers (`resolveGlyph`, `getGlyphForEmbodiment`, `getFallbackGlyph`)

### Wave 2D — Test alignment
**Risk:** low  
**Files:** `tests/gnomes/registry.test.ts`, `tests/routing/gnomeSelector.test.ts`, `tests/output/renderVoiceSigils.test.ts`, `tests/prompts/promptFragments.test.ts`

Actions:
- updated registry tests to validate embodiment compatibility loading
- added assertions for embodiment aliases in routing/output layers
- added prompt fragment test coverage for the new organoid fragment tree

## Mapping status used in this run

### CONFIRMED
- Legacy ids remain compatibility ids for the seven confirmed embodiment mappings.
- Prompt routing can safely prefer organoid fragments while keeping legacy fragment fallback.
- YAML-backed profile loading is a safe migration bridge because the schema already matches the needed fields.

### PROBABLE
- The new `data/gnomes/*.yaml` store can remain as the temporary compatibility path until a later rename to an embodiment-native directory.

### UNSURE
- When to hard-rename the `data/gnomes` directory.
- When to rename `composeGnomePrompt` itself instead of exporting an alias.

## Files touched

- `data/gnomes/stillhalter.yaml`
- `data/gnomes/wurzelwaechter.yaml`
- `data/gnomes/pilzarchitekt.yaml`
- `data/gnomes/muenzhueter.yaml`
- `data/gnomes/erzlauscher.yaml`
- `data/gnomes/glutkern.yaml`
- `data/gnomes/nebelspieler.yaml`
- `prompts/fragments/organoids/*.md`
- `src/prompts/promptFragments.ts`
- `src/prompts/composeGnomePrompt.ts`
- `src/gnomes/loadGnomes.ts`
- `src/gnomes/sigils.ts`
- `tests/gnomes/registry.test.ts`
- `tests/routing/gnomeSelector.test.ts`
- `tests/output/renderVoiceSigils.test.ts`
- `tests/prompts/promptFragments.test.ts`

## Follow-up

Next wave should move from compatibility assets to first-class embodiment-native runtime naming in selected modules, then regenerate semantic records and migrate high-signal prompts/tests that still enforce legacy GNOMES/GORKY wording.

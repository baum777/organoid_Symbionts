# Organoid Lore And Matrix

Canonical sources:

- [ORGANOID_EMBODIMENTS.md](./ORGANOID_EMBODIMENTS.md) - the seven embodiments, glyph anchors, and role profiles
- [ORGANOID_ORCHESTRATION.md](./ORGANOID_ORCHESTRATION.md) - five-phase model, resonance logic, and orchestration contract
- [LORE.md](./LORE.md) - symbolic framing and design intent
- [WHITEPAPER_INTRO.md](./WHITEPAPER_INTRO.md) - canonical framing for the semantic symbiont model
- [WHITEPAPER_INTRO_EN.md](./WHITEPAPER_INTRO_EN.md) - English companion version of the same framing
- [VOICE_GUIDE.md](./VOICE_GUIDE.md) - voice and cadence reference
- [../../README_SYMBIONTS.md](../../README_SYMBIONTS.md) - operator cheat sheet and migration notes

Runtime surfaces:

- prompt surfaces: `prompts/system/organoid_system.md`, `prompts/system/*.yaml`, `prompts/tasks/*.yaml`
- command and preset prompts: `prompts/commands/*.yaml`, `prompts/presets/*.yaml`
- active embodiment fragments: `prompts/fragments/embodiments/*.md`
- legacy compatibility fragments: `prompts/fragments/gnomes/*.md`
- shared canon fragments: `prompts/fragments/sharedCanon.md`, `prompts/fragments/sharedOrganoidCanon.md`
- organoid prompt context: `src/context/prompts/organoid/*.md`
- orchestration runtime: `src/organoid/*.ts`
- embodiment runtime: `src/embodiment/*.ts` and `src/embodiments/*.ts`

Working rule:

- prefer embodiment-first language in new canonical writing
- keep the seven embodiments and five phases canonical
- treat orchestration as stateful: `signal -> phase -> resonance -> roles -> expression -> validation`
- keep visible glyphs, prompt fragments, and render policy aligned with the matrix

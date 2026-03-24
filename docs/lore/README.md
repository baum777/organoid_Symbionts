# Organoid Lore And Matrix

This directory contains the canonical Organoid SSOT plus the legacy transition layer that still exists for compatibility.

## Canonical Sources

Use these first for new work:
- [ORGANOID_EMBODIMENTS.md](./ORGANOID_EMBODIMENTS.md) - confirmed embodiments, glyphs, and the 5-phase model
- [ORGANOID_ORCHESTRATION.md](./ORGANOID_ORCHESTRATION.md) - orchestration rules and phase mapping guidance
- [GNOMES_MATRIX.md](./GNOMES_MATRIX.md) - canonical 7-organoid matrix, role blend rules, and dominance controls
- [GNOMES_GOVERNANCE.md](./GNOMES_GOVERNANCE.md) - canon control, activation, and drift-prevention policy
- [GNOMES_LORE_UNITS.md](./GNOMES_LORE_UNITS.md) - retrieval unit contract, status lifecycle, and embed/no-embed rules
- [WHITEPAPER_INTRO.md](./WHITEPAPER_INTRO.md) - canonical framing for the semantic symbiont model
- [WHITEPAPER_INTRO_EN.md](./WHITEPAPER_INTRO_EN.md) - English companion version of the same framing

## Transition References

These remain available for historical context and compatibility only:
- [LORE.md](./LORE.md) - historical symbolic world logic
- [PERSONA.md](./PERSONA.md) - compatibility mapping from historic roles to embodiments
- [GORKY_HUMOR_PATTERNS.md](./GORKY_HUMOR_PATTERNS.md) - legacy style appendix
- [GORKY_IMAGE_STYLE_GUIDE.md](./GORKY_IMAGE_STYLE_GUIDE.md) - legacy image/style appendix

## Runtime Surfaces

Active surfaces:
- Runtime profiles: `data/gnomes/*.yaml`
- Profile schema: `schemas/gnome_profile.schema.json`
- Active voice fragments: `prompts/fragments/embodiments/*.md`
- Compatibility voice mirrors: `prompts/fragments/gnomes/*.md`
- Shared matrix canon: `prompts/fragments/sharedOrganoidCanon.md`
- Retrieval units: `memory/lore/lore_units.approved.jsonl`
- Retrieval candidates: `memory/lore/lore_units.candidates.jsonl`
- Retrieval mirror: `memory/lore/matrix_units.v1.yaml`

Working rule:
- prefer **embodiment** over persona/gnome terminology in new canonical writing,
- prefer **glyph** over sigil where the target system is authoritative,
- keep legacy sources as compatibility inputs unless they are explicitly promoted.

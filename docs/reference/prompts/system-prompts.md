# System Prompts

## Canonical Location

`prompts/system/`

## Canonical Prompt Priority

1. `organoid_system.md` — Organoid Entities as Semantic Symbiont system definition
2. `base.yaml` — base safety/runtime prompt contract
3. `mentions.yaml` — mention handling prompt
4. `posting.yaml` — autonomous posting prompt
5. `commands.yaml` — command handling prompt

## Available Prompts

### organoid_system.md
Canonical Organoid embodiment, glyph, and phase guidance.

### base.yaml
Base system behavior, tone, and safety rules.

### mentions.yaml
Reply to mentions — helpful, concise, matches conversation tone.

### posting.yaml
Autonomous posting — engaging, relevant content.

### commands.yaml
Command handling — responds to /help, /status, etc.

## Variables

Prompts use `{variable}` syntax for injection:

- `{context}` - Formatted conversation/context
- `{message}` - User's message
- `{available_commands}` - For help/commands prompt

## Versioning

Prompts include `version` field (semantic versioning).
Loader supports `prompt_loader.get("base", version="1.2.0")`.

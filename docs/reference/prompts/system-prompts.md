# System Prompts

## Canonical Location

`prompts/system/`

## Canonical Prompt Priority

1. `organoid_system.md` - canonical organoid system prompt surface
2. `base.yaml` - base safety/runtime prompt contract
3. `mentions.yaml` - mention handling prompt
4. `posting.yaml` - posting prompt surface
5. `commands.yaml` - command handling prompt

## Available Prompts

### `organoid_system.md`
Canonical organoid embodiment, glyph, phase, and orchestration guidance.

### `base.yaml`
Base system behavior, tone, and safety rules.

### `mentions.yaml`
Reply to mentions with concise, on-brand behavior.

### `posting.yaml`
Posting prompt surface for controlled posting paths.

### `commands.yaml`
Command handling for `/help`, `/status`, and related control commands.

## Variables

Prompts use `{variable}` syntax for injection:

- `{context}` - formatted conversation / thread context
- `{message}` - the current user message
- `{available_commands}` - command list for help surfaces

## Versioning

Prompt files carry versioned content where needed. The current loader entrypoints live under `src/context/prompts/` and resolve the system prompt surfaces and runtime fragments used by the worker.

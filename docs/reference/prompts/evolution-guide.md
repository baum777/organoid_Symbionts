# Prompt Evolution Guide

## Editing Prompts Safely

1. Edit the prompt file in `prompts/`
2. Keep the prompt surface aligned with the current runtime contract
3. Validate with the relevant TypeScript tests instead of a separate Python dry-run script
4. Document meaningful changes in `docs/changelog/CHANGELOG.md`

## Adding New Prompts

1. Create the prompt file in the appropriate subdirectory:
   - `prompts/system/`
   - `prompts/tasks/`
   - `prompts/presets/`
   - `prompts/commands/`
2. Include a stable name, description, and content
3. Define variables with `{variable_name}` only where the runtime actually injects them
4. Update the prompt index docs when the surface becomes canonical

## Presets

Presets such as `witty`, `technical`, and `casual` modify the base behavior.
They are loaded from `prompts/presets/` and should remain additive, not identity-defining.

## Validation

Use the current TypeScript prompt loaders in `src/context/prompts/` and the relevant test suites under `tests/context/`, `tests/prompts/`, and `tests/organoid/` to confirm the new prompt still matches the runtime contract.

# Task Prompts

## Location

`prompts/tasks/`

## Available Tasks

### `summarize.yaml`
Summarizes conversation context for compact downstream use.

### `generate_image.yaml`
Creates an image-generation prompt from a user request and style context.

## Usage

Task prompts are loaded by the TypeScript prompt loader in `src/context/prompts/` and consumed by the current runtime services. Keep prompt names stable and keep the files aligned with the runtime contract.

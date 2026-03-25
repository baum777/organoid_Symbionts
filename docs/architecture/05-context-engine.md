# Context Engine

## Overview

The context engine provides thread analysis, keyword extraction, and optional timeline sampling for the canonical pipeline. It is a support layer, not a parallel identity layer.

## Current Building Blocks

- `contextBuilderV2` - walks the reply chain and assembles thread context
- `timelineScoutV2` - samples recent tweets by keywords for optional timeline briefs
- `semantic/*` - optional semantic ranking, embedding, and clustering support
- `hybridTrace` - trace metadata for context-path observability
- `guards.ts` - pre-LLM safety and shape checks

## Data Flow

1. `MentionInput` is normalized from the X payload.
2. `buildThreadContextV2()` walks the reply chain up to the configured depth.
3. `extractKeywords()` parses entities, claims, and context hints.
4. `buildTimelineBriefV2()` optionally samples recent tweets for topical context.
5. Guards and policy checks run before the LLM call.
6. The resulting context feeds prompt assembly and then the canonical pipeline.

## Safety + Governance

- PII and unsafe content are blocked before generation
- reply length stays bounded by the canonical mode budget
- thread depth is capped
- timeline sampling is bounded by configured query and result limits

## Runtime Note

The context engine informs the canonical pipeline and organoid orchestration, but it does not own the output contract. The orchestration contract remains the source of truth for phase, resonance, silence, and render policy.

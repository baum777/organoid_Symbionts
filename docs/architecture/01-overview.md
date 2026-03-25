# System Overview

## Goals

- Organoid-first mention handling on X
- stateful orchestration across seven embodiments and five phases
- short-term matrix persistence for phase continuity and drift control
- fail-closed validation, publish safety, and observability
- optional sidecar flows such as image generation and timeline engagement

## High-Level Architecture

The current runtime is organized around a canonical pipeline plus a stateful organoid orchestration layer:

1. **Input Layer** - X API polling, mention normalization, scheduler ticks
2. **Canonical Pipeline** - classify, score, derive thesis, validate, and decide
3. **Organoid Orchestration** - phase inference, resonance scoring, role planning, expression policy
4. **Prompt / Render Layer** - prompt fragments, glyph rendering, output formatting
5. **Persistence Layer** - StateStore-backed cursor, dedupe, publish, and short-term matrix state
6. **Observability Layer** - structured logs, metrics, health checks, audit records

## Key Design Principles

- Semantics before style
- Phase before embodiment selection
- Resonance and roles before final output
- Validation and silence are hard gates
- Persisted runtime state beats prompt-only memory

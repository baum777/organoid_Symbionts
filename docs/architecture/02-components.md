# Component Overview

## Core Components

### Worker / Poller
Drives the event loop, polls X, and hands normalized mentions to the canonical pipeline.

### Canonical Pipeline
Performs classify → score → thesis → validate → publish decision processing.

### Organoid Orchestrator
Infers phase, scores embodiment resonance, builds the role plan, and emits the orchestration contract.

### State Store
StateStore-backed persistence for cursor, dedupe, publish markers, locks, health heartbeat, and the short-term organoid matrix.
Multi-worker production uses Redis; filesystem storage is for single-worker use.

### X Client and Read Client
Handle post/poll operations and tweet retrieval for context building.

### LLM Clients
Provider adapters for xAI, OpenAI, and Anthropic behind the unified `LLMClient` contract.

### Prompt Loader and Fragments
Loads system, task, and fragment prompts and injects the current orchestration context.

### Context Engine
Builds thread context, timeline briefs, and semantic support signals for the canonical pipeline.

### Observability
Structured logs, metrics, health checks, audit records, and run artifacts.

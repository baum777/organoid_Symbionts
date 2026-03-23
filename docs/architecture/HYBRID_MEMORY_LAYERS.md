# Hybrid Memory Layers

## Purpose
Define the additive hybrid memory namespace for recurring partner memory in the Organoid project.

This document is repo-root guidance for the new `src/memory/hybrid` surface. It is intentionally separate from the legacy persona stack and does not replace any current runtime path.

## Scope
The hybrid memory namespace introduces a frozen contract for these canonical object families:

- `Partner`
- `Episode`
- `MemoryAtom`
- `PartnerSnapshot`
- `OrganoidProjection`
- `RetrievalContextPack`
- `ConsolidationJob`
- `RevisionEvent`

This slice is only a contract freeze. It does not add persistence, embeddings, read-path integration, projections, consolidation, shadow mode, or deploy wiring.

## Authority model

### Current authority anchors that remain unchanged

- `data/gnomes/*.yaml` remains the persona SSOT.
- `src/gnomes/types.ts` remains the compatibility validator for gnome profiles.
- `src/routing/gnomeSelector.ts` remains the live routing authority.
- `src/context/contextBuilderV2.ts` remains the current runtime context builder.
- `src/persona/*` remains the legacy derived persona stack.
- `src/context/semantic/*` remains the existing semantic retrieval engine.
- `src/memory/userGraph.ts` remains the current recurring-user interaction anchor.

### Hybrid authority rules

- `Partner`, `Episode`, and `MemoryAtom` are authoritative hybrid objects.
- `PartnerSnapshot` is a compact derived read model over the partner core.
- `OrganoidProjection` is derived only and must never become a second source of truth.
- `RetrievalContextPack` is an assembled handoff object, not a memory store.
- `ConsolidationJob` is workflow metadata, not truth.
- `RevisionEvent` is the audit trail for meaningful durable changes.

## Additive namespace strategy

- Introduce hybrid memory as `src/memory/hybrid`.
- Keep the legacy persona and routing stack intact.
- Avoid rewriting existing memory helpers into hybrid coordinators.
- Prefer explicit migration seams over hidden reuse.

## Object-family rules

### Partner
Thin recurring-entity anchor only.

- Holds identity and reference fields needed to tie partner memory together.
- Does not become a second profile system.
- Does not own full interaction history.

### Episode
Normalized evidence unit.

- Captures one interaction slice or notable memory event.
- Links to a partner and optional source or embedding references.
- Preserves evidence before durable inference.

### MemoryAtom
Durable evidence-backed partner-core statement.

- Represents a claim, trait, preference, habit, or continuity signal.
- Carries confidence, freshness, stability, and lifecycle state.
- Must remain supported by explicit evidence references.

### PartnerSnapshot
Compact shared-core read model.

- Summarizes the current partner core.
- References active atoms and compact summary structures.
- Must not override authoritative partner truth.

### OrganoidProjection
Derived role-specific view.

- Generated from shared core plus current context.
- Invalidatable and regenerable.
- Must remain non-authoritative.

### RetrievalContextPack
Bounded downstream handoff.

- Contains only a selected, explainable subset of memory context.
- Must not imply a raw memory dump.
- Must remain small enough for prompt or execution handoff use.

### ConsolidationJob
Controlled workflow instruction.

- Describes what consolidation should process.
- Does not hide mutation semantics.

### RevisionEvent
Explicit durable-change audit record.

- Records what changed, why it changed, and what evidence or contradiction caused the change.
- Must prevent silent overwrite semantics.

## Storage and retrieval principle

- The vector layer is an access engine only.
- Structured memory remains the semantic source of truth.
- Projections and retrieval packs are derived surfaces, not truth stores.

## Migration rule

Shadow mode first, live reliance later.

- Build the contract first.
- Validate against the legacy stack before any runtime dependence.
- Keep rollback simple by preserving the old path until the hybrid path is proven bounded and explainable.

## Anti-patterns to avoid

- Projection becoming authority.
- Vector DB becoming truth.
- Hidden mutation without revision events.
- Replacing legacy persona types too early.
- Turning helper code into an unbounded coordinator.
- Letting retrieval packs become full transcript dumps.


---
name: architecture-planner
description: Analyzes repository and spec context to infer a concrete target-state architecture and produce a phased execution plan with gaps, dependencies, risks, and verification points. Use when the user asks for architecture review/target state planning, when a feature spans multiple modules, or when refactor/migration planning is needed.
---

# Architecture Planner

Use this skill to turn **repo state + specs/requests** into a **clear target state** and a **phased delivery plan** that is auditable, low-regret, and aligned with existing conventions.

## Operating mode

- Prefer **minimal viable architecture progress** over broad rewrites.
- Be explicit about **assumptions**, **interfaces**, and **verification**.
- Separate **facts** (what exists) from **inference** (what should be).
- Optimize for **reproducibility** and **rollout safety**.

## When to apply

Apply when any of the following is true:

- The user asks for an **architecture review** or **target-state** proposal.
- The change spans **multiple modules/services/packages**.
- A **migration/refactor** needs staging, sequencing, and rollback.
- There are **non-trivial risks** (data integrity, security boundaries, determinism, performance, governance/auditability).

## Inputs to request (only if missing)

If not already provided in the conversation, ask for:

- The **objective** (what success means) and **non-goals**
- Any **specs** / ADRs / RFCs / diagrams (or their paths)
- Constraints: **time**, **risk tolerance**, **backwards compatibility**, **deployment target**
- Ownership boundaries: **teams**, **modules**, **services**
- Acceptance criteria and **how to verify** in prod/stage

## Process (do this every time)

1. **Inventory current state**
   - Identify the top-level structure (apps/packages/services).
   - Identify the primary entrypoints, runtime boundaries, and data stores.
   - Note existing conventions (naming, layering, error handling, config, testing).
   - Extract the relevant “golden paths” (critical flows, APIs, pipelines).

2. **Infer target state**
   - Derive a target architecture from the objective + constraints + repo patterns.
   - Define the boundaries: modules, ownership, and public interfaces.
   - Define runtime invariants (determinism, idempotency, ordering, failure behavior).
   - Prefer adapting existing components over introducing new stacks.

3. **Describe gaps**
   - Map current → target as a list of concrete deltas (code, data, config, ops).
   - Classify each gap as **must-have** vs **optional**.

4. **Plan execution waves**
   - Sequence work to keep the system shippable at each wave.
   - Include dependencies and safe rollout steps (feature flags, dual-write, backfills).
   - Include rollback considerations where changes are risky/irreversible.

5. **Risk & verification**
   - List key risks and how each is mitigated or detected.
   - Provide verification points: tests, checks, observability, and acceptance criteria.

## Guardrails

- Do **not** propose broad rewrites unless the current architecture demonstrably blocks the objective.
- Do **not** overfit to a single file; confirm patterns across the repo before recommending structure changes.
- Avoid introducing new abstractions unless they reduce complexity across multiple modules.
- Prefer **explicit interfaces** and **traceable decision paths** over hidden heuristics.
- Under uncertainty, prefer **fail-closed** behavior for safety-critical flows.

## Output template (use this exact structure)

Return a plan using the headings below, in this order.

### Objective
- **Goal**:
- **Non-goals**:
- **Constraints**:
- **Success criteria**:

### Current State
- **Repo shape**:
- **Key modules/services**:
- **Critical flows**:
- **Data/config/ops**:
- **Notable constraints/anti-patterns**:

### Target State
- **Architecture overview**:
- **Boundaries & ownership**:
- **Public interfaces** (APIs/events/contracts):
- **Runtime invariants**:
- **Observability & auditability**:

### Gaps
- **Must-have**:
- **Optional improvements**:

### Execution Waves
- **Wave 0 — alignment & baselines** (docs, invariants, test harness, metrics):
- **Wave 1 — foundations** (interfaces, scaffolding, compatibility layers):
- **Wave 2 — migration/feature delivery** (incremental rollouts, data moves):
- **Wave 3 — hardening & cleanup** (remove old paths, tighten policies):

### Risks
- **Top risks** (with impact, likelihood, mitigation, detection):

### Verification
- **Per-wave checks**:
- **Regression surface**:
- **Rollout/rollback plan**:

### Recommended next step
- The single highest-leverage action to start (e.g., “read these specs + map module boundaries”).

## Examples (concise)

### Example: multi-module feature

**User request**: “Add policy enforcement across API + worker pipeline.”

**Use this skill to produce**:
- Target state with a single policy boundary (library/service), explicit contracts, audit logs.
- Waves: baseline metrics → interface + policy stub → enforcement in shadow mode → hard enforcement + cleanup.

### Example: migration/refactor

**User request**: “Split monolith module into packages without breaking runtime behavior.”

**Use this skill to produce**:
- Target state package boundaries and public APIs.
- Waves: dependency graph + tests → extract shared types → move leaf modules → move core → remove old imports.

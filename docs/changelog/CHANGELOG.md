# Changelog

## [Unreleased]

### Added

- **Compliance-first X engagement layer**: neue Consent-/Energy-/Decision-Schicht vor dem bestehenden Canonical Pipeline Flow.
- **Fail-closed engagement runtime**: `SKIP`, `HOLD`, `REVIEW`, `ENGAGE`, `BLOCK` mit harten Gates für Opt-out, Auth, AI-Approval, Budget und Duplicate-State.
- **Write preflight**: interaction-based reservation, target existence check und duplicate replay protection vor jedem Write.
- **Worker hardening**: Mention- und Timeline-Pfade prüfen jetzt Consent, Energy, Budget und Preflight vor Generation/Writes.
- **Observability**: normierte Compliance-Metriken und Reason-Codes für Audit, Metrics und Operator-Surfaces.
- **Compliance docs**: neue Doku für Entscheidungslogik und Test-Spec unter `docs/compliance/`.
- **Test coverage**: neue Unit-, Integration- und Operator-Surface-Tests für RED-Zonen und fail-closed Verhalten.

### Added

- **Konversations-Simulation**: `createSimulatedCanonicalEvent` (tests/utils/testEventFactory.ts) mit optionalen Parametern `parent_text`, `conversation_context`, `context` für realistische Reply- und Multi-Turn-Szenarien.
- **simulateConversation.ts**: Automatisiertes Durchspielen von Gesprächsverläufen (User → Bot → User → Bot …). Bot-Antworten fließen als `parent_text` und in `conversation_context` in den nächsten Turn.
- **JSONL-Loader**: Szenarien aus `scripts/scenarios/conversation_scenarios.jsonl` oder eigener Datei (`--file`) ladbar.
- **Keyword-Assertions**: `expectedKeywords` pro Turn; bei `--strict` führt Fehlschlag zu `process.exit(1)` (CI-tauglich).
- **Scripts**: `pnpm simulate`, `pnpm simulate:ci` für lokale und CI-Regressionstests.

---

## [0.1.0] - 2026-02-27

### Added

- Initial repository structure
- Python project setup (pyproject.toml)
- Config system (Pydantic Settings)
- Structured logging (structlog)
- SQLite schema and migrations
- StateManager, Deduplicator, ConversationTracker
- X Client with OAuth 1.0a
- xAI Client with retry logic
- Media Client stub
- Event system and EventRouter
- Prompt system (Loader, YAML, versioning)
- Workflow engine with steps
- Mention handler
- Command parser and registry
- Observability (metrics, health check)
- Documentation (architecture, workflows, ADRs)
- Dry run script
- Health check script

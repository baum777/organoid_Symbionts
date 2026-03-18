# Architecture Planner – Beispiele

Diese Beispiele zeigen, wie ein ausgefüllter Architektur-Plan mit dem `architecture-planner`-Skill aussehen soll. Halte dich eng an diese Struktur, passe Inhalte aber an das konkrete Repo und den Request an.

---

## Beispiel 1: Policy-Enforcement über API + Worker-Pipeline

**Kurzbeschreibung**: Ein bestehender Service hat eine HTTP-API und eine asynchrone Worker-Pipeline. Policies werden aktuell ad-hoc in mehreren Stellen geprüft; Ziel ist ein einheitlicher Policy-Layer mit Audit-Logs.

### Objective
- **Goal**: Einheitliche, zentral konfigurierbare Policy-Enforcement-Schicht für API-Requests und Worker-Jobs, inkl. Audit-Logging und klarer Deny-/Allow-Entscheidungen.
- **Non-goals**: Kein vollständiges Redesign der Domain-Modelle; keine Änderungen am Authentifizierungsmechanismus (Tokens/OAuth bleiben unverändert).
- **Constraints**: Zero-downtime-Rollout, bestehende API-Contracts bleiben stabil; begrenzte Kapazität für parallele Datenmigration.
- **Success criteria**: Alle sicherheitsrelevanten Aktionen laufen über eine zentrale Policy-Schnittstelle; jede Entscheidung ist auditierbar; keine Regressionen im Durchsatz.

### Current State
- **Repo shape**: Monorepo mit `api/`, `worker/`, `shared/` (Utilities, DTOs).
- **Key modules/services**:
  - `api/handlers/*` mit direkten Zugriffen auf Repositories.
  - `worker/jobs/*` mit heterogenen Patterns für Validierung und Fehlerbehandlung.
- **Critical flows**:
  - Eingehender HTTP-Request → Handler → Domain-Service → DB.
  - Asynchrone Jobs, die über Queue getriggert werden und direkt auf DB und externe APIs zugreifen.
- **Data/config/ops**:
  - Policy-Konfiguration ist über mehrere `config/*.yml` verteilt.
  - Logging uneinheitlich; teilweise kein Korrelations-Id-Konzept.
- **Notable constraints/anti-patterns**:
  - Policy-Checks sind dupliziert und teilweise widersprüchlich.
  - Fehlende klare Trennung zwischen „Policy-Entscheidung“ und „Ausführung“.

### Target State
- **Architecture overview**:
  - Einführung eines `policy`-Moduls (z.B. `shared/policy/`) mit klarer API:
    - `evaluate(subject, action, resource, context) -> decision`.
  - API-Handler und Worker-Jobs rufen vor kritischen Operationen ausschließlich diese Policy-API auf.
- **Boundaries & ownership**:
  - `policy`-Modul gehört dem Platform/Security-Team.
  - Fachliche Services bleiben im Verantwortungsbereich der jeweiligen Domänen-Teams.
- **Public interfaces** (APIs/events/contracts):
  - Synchrone Schnittstelle im Code: `PolicyClient.evaluate(...)`.
  - Optionaler Event-Stream für Policy-Entscheidungen (`policy.decision.emitted`).
- **Runtime invariants**:
  - Jede sicherheitskritische Operation hat genau einen vorgelagerten Policy-Call.
  - Policy-Entscheidungen sind deterministisch bzgl. Input (gleicher Input → gleiche Entscheidung).
- **Observability & auditability**:
  - Jeder Policy-Call erzeugt ein Audit-Event mit Korrelations-Id.
  - Dashboards/Alerts auf „Policy-Denies“ pro Aktion und Mandant.

### Gaps
- **Must-have**:
  - Zentrales `policy`-Modul mit klarer Evaluierungs-API.
  - Refactoring der wichtigsten API-Handler und Worker-Jobs auf das neue Interface.
  - Einheitliches Logging/Audit-Event pro Policy-Entscheidung.
- **Optional improvements**:
  - Policy-Konfiguration in eigenem Store (z.B. DB oder Feature-Flag-System).
  - Declarative Policy-Definition (z.B. YAML/DSL), statt reinem Code.

### Execution Waves
- **Wave 0 — alignment & baselines**:
  - Policy-relevante Aktionen inventarisieren und klassifizieren.
  - Bestehende Logging-/Tracing-Fähigkeiten prüfen; minimale Metriken definieren.
- **Wave 1 — foundations**:
  - `policy`-Modul scaffolden (Interface, Fehlerklassen, Telemetrie-Hooks).
  - Erste Policies in „shadow mode“ implementieren (nur loggen, nicht blockieren).
- **Wave 2 — migration/feature delivery**:
  - Schrittweiser Umbau der wichtigsten API-Handler/Jobs auf Policy-Client.
  - Shadow Mode → Hard Enforcement pro Aktion/Feature-Flag.
- **Wave 3 — hardening & cleanup**:
  - Direkte Inline-Checks entfernen.
  - Alte, nicht mehr genutzte Configs löschen.
  - Dokumentation aktualisieren (Runbooks, Onboarding).

### Risks
- **Top risks** (mit Impact, Likelihood, Mitigation, Detection):
  - Fehlkonfigurierte Policies führen zu legitimen Denies.
  - Unvollständige Migration (einige Pfade ohne Policy-Check).
  - Performance-Regressionen durch zusätzliche Calls/Logging.

### Verification
- **Per-wave checks**:
  - Wave 1: Shadow-Logs vs. erwartetem Verhalten vergleichen.
  - Wave 2: Canary-Rollout mit enger Beobachtung von Error-Rates und Latency.
- **Regression surface**:
  - Alle sicherheitskritischen Endpunkte und Worker-Jobs.
- **Rollout/rollback plan**:
  - Feature-Flags pro Aktion; schnelle Deaktivierung des Enforcement möglich.

### Recommended next step
- Gemeinsames Alignment-Dokument erstellen, das alle Policy-relevanten Flows und Owner auflistet.

---

## Beispiel 2: Schrittweise Paketierung eines Monolith-Moduls

**Kurzbeschreibung**: Ein großes `core`-Modul im Monolithen enthält Domain-Logik, DTOs, und Infra-Zugriffe. Ziel ist eine Aufteilung in klar geschnittene Packages, ohne Verhalten zu ändern.

### Objective
- **Goal**: Das `core`-Modul in mehrere logisch getrennte Packages aufteilen (`core-domain`, `core-infra`, `core-api`), um Abhängigkeiten zu klären und spätere Extraktion zu erleichtern.
- **Non-goals**: Kein sofortiger Umzug in eigenständige Services; keine Änderung an externen API-Verträgen.
- **Constraints**: Build-Zeiten dürfen nicht signifikant steigen; Tests müssen während der Migration stabil bleiben.
- **Success criteria**: Build & Tests grün, klar definierte Public-APIs pro Package, keine zyklischen Abhängigkeiten zwischen den neuen Packages.

### Current State
- **Repo shape**: Single-App mit `core/`, `web/`, `jobs/`.
- **Key modules/services**:
  - `core/models/*`, `core/services/*`, `core/repositories/*` in einem Namespace.
- **Critical flows**:
  - Web-Controller greifen direkt auf `core`-Services und Repositories zu.
- **Data/config/ops**:
  - Configs liegen verteilt, teilweise direkt in `core`.
- **Notable constraints/anti-patterns**:
  - Viele Querverweise innerhalb `core`; keine klare Layering-Guideline.

### Target State
- **Architecture overview**:
  - Packages:
    - `core-domain`: Entities, Value Objects, Domain-Services.
    - `core-infra`: DB-Repositories, externe API-Adapter.
    - `core-api`: Fassade, die von `web`/`jobs` verwendet wird.
- **Boundaries & ownership**:
  - Domain-Owner verantworten `core-domain`.
  - Platform/Infra-Team verantwortet `core-infra`.
- **Public interfaces** (APIs/events/contracts):
  - `core-api` stellt stabile Funktionen/Services bereit, die intern Domain+Infra koordinieren.
- **Runtime invariants**:
  - `web`/`jobs` dürfen nur `core-api` referenzieren, nicht `core-domain`/`core-infra` direkt.
- **Observability & auditability**:
  - Logging und Metriken werden an den API-Fassaden-Punkten konzentriert.

### Gaps
- **Must-have**:
  - Existierende Abhängigkeiten und zyklische Referenzen analysieren.
  - Public API von `core-api` definieren.
  - Tests gegen `core-api` statt interne Klassen ausrichten.
- **Optional improvements**:
  - Konsistente Error-Typen und Mapping auf HTTP/Job-Fehlercodes.

### Execution Waves
- **Wave 0 — alignment & baselines**:
  - Dependency-Graph erzeugen (z.B. via Linter/Tooling).
  - Kritische Flows und ihre Entry-Points dokumentieren.
- **Wave 1 — foundations**:
  - Neue Packages anlegen, Basis-Struktur & Namespaces definieren.
  - Shared Types/DTOs in `core-domain` konsolidieren.
- **Wave 2 — migration/feature delivery**:
  - Leaf-Module zuerst verschieben (niedriges Risiko).
  - Schrittweise Controller auf `core-api` umstellen.
- **Wave 3 — hardening & cleanup**:
  - Direkte Zugriffe auf `core-domain`/`core-infra` aus `web`/`jobs` entfernen.
  - Alte Pfade/Imports löschen, Lint-Regeln anpassen.

### Risks
- **Top risks**:
  - Versehentliche Verhaltensänderungen beim Verschieben von Code.
  - Versteckte Seiteneffekte in Initialisierungs-Logik.

### Verification
- **Per-wave checks**:
  - Regression-Tests nach jedem Paket-Refactor.
  - Smoke-Tests der wichtigsten Business-Flows.
- **Regression surface**:
  - Alle Flows, die `core` intensiv nutzen (Haupt-APIs, Batch-Jobs).
- **Rollout/rollback plan**:
  - Änderungen in kleinen, revertierbaren Commits bündeln.

### Recommended next step
- Dependency-Analyse-Tool laufen lassen und eine erste Skizze der zukünftigen Packages erzeugen.

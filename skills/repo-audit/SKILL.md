---
name: repo-audit
description: Audits a repository for architecture coherence, production readiness, operational risk, and missing safeguards. Use when the user asks for a codebase review, readiness assessment, architecture grading, or to find missing safeguards before going to production.
---

# Repo Audit

Nutze dieses Skill, um einen vorhandenen Code-Stand systematisch auf **Architektur-Qualität** und **Produktionsreife** zu prüfen – mit Fokus auf Produktkern, Risiken und fehlende Safeguards.

## Wann anwenden

Verwende dieses Skill, wenn:
- der User explizit nach einem **Codebase-Review** oder einer **Readiness-Einschätzung** fragt,
- die **Architekturqualität** bewertet oder eingeordnet werden soll,
- vor Go-Live **Risiken** und **fehlende Safeguards** identifiziert werden sollen.

## Prüf-Dimensionen

Beziehe dich bei jedem Audit explizit auf diese Dimensionen:
- Architektur-Kohärenz
- Modul- und Service-Grenzen
- Runtime-Sicherheit (Fehlerverhalten, Timeouts, Ressourcen)
- Observability (Logs, Metriken, Tracing)
- Testbarkeit (Abdeckung, Granularität, Stabilität)
- Deployment-Readiness (Build, CI/CD, Konfiguration)
- Governance-/Compliance-Surface (Audits, Rollen, Policies)
- Dokumentationsqualität (Architektur, Betriebsdokus, Runbooks)

## Vorgehen

1. **Scope klären**
   - Verstehe, ob der Fokus auf ganzem Repo, Teilbereich oder Produktkern liegt.

2. **Repo-Struktur erfassen**
   - Identifiziere Apps, Services, Packages, zentrale Pipelines und Datenpfade.

3. **Pro Dimension bewerten**
   - Erfasse **Stärken**, **Schwächen** und **kritische Risiken** entlang der oben genannten Dimensionen.

4. **Produktionsreife einschätzen**
   - Ziehe eine qualitative Score-Kennung (z.B. Low / Medium / High) heran.

5. **Konkrete Schritte ableiten**
   - Formuliere **sofort wirksame Fixes** und eine **Transformationsstrecke** mit mehreren Schritten.

## Output-Template (immer verwenden)

Gib dein Ergebnis in folgendem Format zurück.

### Executive Summary
- Kurzfassung in 3–6 Sätzen: aktueller Zustand, Reifegrad, wichtigste Risiken und Chancen.

### Strengths
- Aufzählung der wichtigsten Stärken entlang der Audit-Dimensionen.

### Weaknesses
- Aufzählung der spürbaren Schwächen / Lücken, geordnet nach Relevanz.

### Critical Risks
- Konkrete, plausibel ausnutzbare Risiken mit kurzer Begründung, warum sie kritisch sind.

### Production Readiness Score
- Qualitative Einschätzung (z.B. **Low / Medium / High**) mit 1–3 Sätzen Begründung.

### Immediate Fixes
- 3–10 **sofort angehbare Maßnahmen**, die mit hohem Hebel und überschaubarem Risiko die Situation verbessern.

### Step-by-step transformation path
- Mehrstufige Transformationsroute (z.B. Wave 0–3) mit:
  - Fokus je Schritt,
  - groben Aufgabenclustern,
  - erwartbarem Nutzen,
  - Hinweis auf notwendige Safeguards / Tests.


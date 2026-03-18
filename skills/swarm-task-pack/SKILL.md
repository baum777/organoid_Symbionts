---
name: swarm-task-pack
description: Splits work into role-specific agent tasks with clear boundaries, dependencies, and review flow. Use when work should be distributed across planner, implementer, reviewer, and QA agents with explicit handoffs.
---

# Swarm Task Pack

Nutze dieses Skill, um Arbeit über mehrere **Rollen/Agenten** zu verteilen – z.B. Planner, Implementer, Reviewer, QA – mit klaren Grenzen, Abhängigkeiten und Handover-Punkten.

## Wann anwenden

Verwende dieses Skill, wenn:
- der User ausdrücklich eine **Multi-Agent-Aufteilung** wünscht,
- Planner / Implementer / Reviewer / QA klar getrennt arbeiten sollen,
- ein **Task-Paket** für externe/weitere Agenten erzeugt werden soll.

## Ziel

Erzeuge ein **Rollenset + Task-Pack**, das:
- Rollen und Verantwortlichkeiten klar benennt,
- Task-Grenzen und Handoffs definiert,
- Abhängigkeiten und Review-Loops beschreibt,
- Acceptance-Kriterien pro Rolle/Schritt explizit macht.

## Vorgehen

1. **Scope und Ziel klären**
   - Welches Problem / Feature / Refactor soll von mehreren Agenten bearbeitet werden?

2. **Rollen definieren**
   - Typisch: Planner, Implementer, Reviewer, QA/Verifier (ggf. weitere Spezialrollen).

3. **Tasks und Grenzen schneiden**
   - Aufgaben so schneiden, dass Rollen möglichst wenig überlappen und Handoffs klar sind.

4. **Abhängigkeiten und Reihenfolge festlegen**
   - In welcher Reihenfolge arbeiten die Rollen? Wo sind Feedback-Loops nötig?

5. **Acceptance-Kriterien + Review-Flow formulieren**
   - Was gilt pro Rolle/Schritt als „done“? Wie läuft Review und Merge/Reconciliation?

## Output-Template (immer verwenden)

### Roles
- Liste aller beteiligten Rollen mit Kurzbeschreibung (z.B. Planner, Implementer, Reviewer, QA).

### Task boundaries
- Auflistung der Aufgabenpakete pro Rolle, inkl. Scope-Grenzen (was gehört explizit **nicht** dazu).

### Handoff order
- Beschreibung der Reihenfolge, in der Rollen aktiv werden (inkl. Rücksprungpunkte bei Änderungen).

### Acceptance criteria
- Kriterien pro Rolle/Schritt, wann Arbeit als abgeschlossen gilt.

### Review loop
- Darstellung, wie Review, Feedback und Korrekturschleifen organisiert sind (wer prüft wen, mit welchem Fokus).

### Merge / reconciliation notes
- Hinweise, wie Ergebnisse aus mehreren Rollen/Branches wieder zusammengeführt werden sollen (inkl. Konfliktlösung, finaler Owner).


---
name: spec-to-execution
description: Converts an existing specification or readiness plan into concrete execution tasks, ordered implementation steps, and verification actions. Use when a spec or plan already exists and must become actionable work with clear next steps.
---

# Spec to Execution

Nutze dieses Skill, um eine vorhandene **Spec / Planung** in konkrete, sequenzierte **Umsetzungsaufgaben** mit klaren Verifikationsschritten zu übersetzen.

## Wann anwenden

Verwende dieses Skill, wenn:
- bereits eine **Spec**, ein **Plan**, eine **Roadmap** oder ein **Readiness-Plan** existiert,
- Phasen und Waves in **konkrete Tasks** heruntergebrochen werden sollen,
- der User explizit nach **Next Steps**, **Implementierungssequenz** oder **Task-Aufteilung** fragt.

## Auftrag

Bei jeder Nutzung:
- harte Anforderungen und getroffene Entscheidungen aus der Spec herausziehen,
- bestehende Architektur-/Planungsentscheidungen explizit **respektieren** (nicht heimlich umwerfen),
- Scope in klar abgegrenzte **Tasks/Scopes** schneiden,
- eine **sinnvolle nächste Scheibe** („slice“) auswählen,
- verifizierbare Tests/Checks pro Scheibe definieren.

## Vorgehen

1. **Spec lesen und strukturieren**
   - Identifiziere Ziele, Nicht-Ziele, Constraints, Abhängigkeiten und bereits getroffene Entscheidungen.

2. **Mögliche Slices identifizieren**
   - Schneide das Vorhaben in mehrere sinnvolle, einzeln lieferbare Scope-Slices.

3. **Nächsten Slice wählen**
   - Begründe, welcher Slice jetzt am meisten Hebel/Risiko-Reduktion bringt.

4. **Tasks und Sequenz ableiten**
   - Erzeuge konkrete, geordnete Implementierungsschritte (Tasks), inkl. grober Dateipfade/Module.

5. **Verifikation definieren**
   - Lege pro Task/Cluster Test- und Verifikationsschritte fest (Unit/Integration/E2E, manuelle Checks).

## Output-Template (immer verwenden)

### Scope slice selected
- Beschreibung des ausgewählten Scheibchens (Fokus, Begrenzung, Kontext).

### Why this slice is next
- 2–5 Sätze, warum diese Scheibe jetzt sinnvoll ist (Hebel, Risiko, Dependencies, schnelle Lernschleifen).

### Implementation tasks
- Geordnete Liste konkreter Tasks (bullet- oder nummeriert), idealerweise klein genug für eigenständige Arbeitspakete.

### Files likely affected
- Aufzählung von Dateien/Verzeichnissen/Modulen, die voraussichtlich geändert werden.

### Verification
- Konkrete Test- und Prüfaktionen (automatisiert + manuell), verknüpft mit den Tasks.

### Done criteria
- Klare, überprüfbare Definition, wann dieser Slice „done“ ist (inkl. technischer und ggf. fachlicher Kriterien).


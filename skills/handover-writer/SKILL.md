---
name: handover-writer
description: Produces a precise handover summary with current state, completed work, open issues, constraints, and a ready-to-paste next-step prompt for another agent. Use only when explicitly asked to prepare or clean up a handover.
---

# Handover Writer

Nutze dieses Skill ausschließlich, wenn explizit um ein **Handover** gebeten wird – z.B. zum Übergang an einen anderen Agenten, Entwickler oder ein späteres Self.

Ziel: In **wenigen, dichten Blöcken** den Zustand, die erledigte Arbeit, offene Punkte und den nächsten sinnvollen Prompt dokumentieren.

## Wann anwenden

Verwende dieses Skill, wenn:
- der User ein Handover / Übergabe-Dokument verlangt,
- Arbeit über Rollen/Agenten hinweg weitergegeben werden soll,
- du einen „Stop-Punkt“ mit klarer Fortsetzung markieren willst.

## Inhaltliche Leitplanken

- Sei **knapp, aber präzise**; keine Ausführlichkeit um der Länge willen.
- Trenne **Fakten**, **offene Fragen** und **Empfehlungen**.
- Formuliere den **Next-Step-Prompt** so, dass ein anderer Agent direkt loslegen kann.

## Output-Template (immer verwenden)

### Summary
- Kurzbeschreibung des aktuellen Zustands, inkl. Kontext und Zielbild.

### Completed
- Stichpunktliste der wichtigsten erledigten Arbeiten / Entscheidungen.

### Open
- Liste offener Aufgaben, Fragen oder Unsicherheiten, idealerweise priorisiert.

### Risks / blockers
- Relevante Risiken, Blocker oder Annahmen, die später überprüft werden müssen.

### Recommended next step
- Eine klare Empfehlung, was der nächste Agent als Erstes tun sollte.

### Ready-to-paste next prompt
- Ein fertig formulierter Prompt-Text, den der User direkt an den nächsten Agenten schicken kann (inkl. kurzem Kontext, Ziel und erster Aufgabe).


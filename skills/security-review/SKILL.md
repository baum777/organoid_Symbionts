---
name: security-review
description: Reviews code and architecture for real security risks, exploitability, unsafe trust assumptions, and missing safeguards. Use when the user asks for a security review, wants to harden a system, or needs to prioritize concrete security fixes over generic style issues.
---

# Security Review

Nutze dieses Skill für fokussierte **Security-Analysen** von Code und Architektur – mit Schwerpunkt auf **reale Angriffsflächen**, **Trust-Boundaries** und **fehlende Safeguards**, nicht auf Stilfragen.

## Fokus

Konzentriere dich auf:
- **Exploitability** (konkrete, plausible Angriffswege),
- Berechtigungs- und **Permission Boundaries**,
- **Secrets-Exposure** (Keys, Tokens, Credentials),
- **Injection-Vektoren** (SQL, Command, Template, Deserialization),
- unsichere Automation / Agents / Hintergrundjobs,
- Authn/Authz-Lücken,
- **Tenant-Isolation** (Multi-Tenancy, Data Leaks),
- **Fail-open**-Verhalten in sicherheitskritischen Pfaden.

Vermeide:
- rein kosmetische oder Lint-ähnliche Anmerkungen ohne Security-Relevanz,
- spekulative Risiken ohne nachvollziehbare Impact-Kette.

## Vorgehen

1. **Angriffsoberfläche verstehen**
   - Identifiziere Entry Points (APIs, CLIs, Cronjobs, Hooks, Events).

2. **Trust-Boundaries kartieren**
   - Wo wechselt Datenbesitz, Authentifizierung oder Netzwerk-Zone?

3. **Kritische Pfade prüfen**
   - Auth/Session, Datenzugriff, Konfiguration, Secrets, externe Integrationen.

4. **Exploitpfade ableiten**
   - Für jede Auffälligkeit eine plausible Exploit-Geschichte skizzieren.

5. **Fixes priorisieren**
   - Fokussiere auf wenige, aber hochrelevante Maßnahmen mit klarer Wirkung.

## Output-Template (immer verwenden)

### Findings
- Liste der einzelnen Sicherheitsbefunde (jeweils kurz benannt).

### Severity
- Einstufung je Finding (z.B. Low / Medium / High / Critical) mit kurzer Begründung.

### Exploit path
- Beschreibung, wie ein Angreifer den Befund realistisch ausnutzen könnte.

### Impact
- Welche Systeme, Daten oder Nutzer sind betroffen? Welcher Schaden ist plausibel?

### Suggested fix
- Konkreter, umsetzbarer Fix-Vorschlag (Code-/Architektur- oder Policy-Ebene).

### Confidence
- Wie sicher ist die Einschätzung (Low / Medium / High) und welche Annahmen liegen zugrunde?


# Organoid Migration Audit — 2026-03-18

> TODO(ORGANOID-MIGRATION): This document is the non-destructive audit/marking artifact for the planned replacement of the legacy GNOMES/GORKY/persona/agent stack with the bundled target system **"Organoid Entities as Semantic Symbiont"**.
>
> REPLACE-WITH-ORGANOID: Use this report as the authoritative migration staging doc for the next replacement run.

## Audit Method

Repo-wide scan performed with targeted `rg` searches over docs, prompts, source, config, tests, fixtures, artifacts, archives, and legacy bundles.

High-signal query families used during the audit included:
- `gorky|gnome|persona|sigil|glyph|archetype|agent|character|matrix|lore|swarm|ritual|world|phase`
- explicit role labels such as `planner|executor|reviewer|qa|narrator`
- narrative/system terms such as `memory`, `orchestration`, `routing`, `voice`, `canon`, `faction`, `world state`

Observed prevalence from raw search counts:
- `gnome`: 986 hits
- `persona`: 571 hits
- `role`: 428 hits
- `agent`: 177 hits
- `archetype`: 269 hits
- `matrix`: 254 hits
- `glyph`: 62 hits
- `sigil`: 83 hits
- `swarm`: 182 hits
- `phase`: 424 hits

---

# 1. Executive Summary

## Gesamteinschätzung

Das Repo ist **stark und strukturell** vom Alt-System durchzogen. Die Legacy-Schicht ist nicht nur Wording, sondern steckt in:
- öffentlicher Identität und README-Darstellung,
- Prompt- und Persona-SSOT,
- Routing-, Memory- und Ensemble-Code,
- Feature-Flags und Env-Konfiguration,
- Test-Harnesses, Fixtures und Snapshots,
- Audit-/Implementierungsdokumenten,
- Archiv- und Legacy-Python-Resten.

## Dominante Legacy-Cluster

1. **GNOMES-Matrix als primäres Runtime-Identitätssystem**  
   Sieben Gnome-Rollen, Sigils, Lore, Voice-Fragmente, Routing und Memory sind quer durch das Repo verteilt.
2. **GORKY als ältere Single-Persona-Linie**  
   Parallel zur GNOMES-Schicht existieren weiterhin GORKY-Prompts, Tests, Schemas, Presets und Stress-Suites.
3. **Mehrere konkurrierende Orchestrierungsmodelle**  
   Neben GNOMES existieren Agent-Rollen (`planner/executor/reviewer/qa/narrator`), Workflow-Phasen (`intake/discovery/...`), Swarm/Cameo-Modelle, World/Faction/Ritual-Layer und ältere Brand-Matrix-/Python-Artefakte.
4. **Verschachtelte Narrative und Symbolsprache**  
   Gnome/Sigil/Lore/World/Swarm/Matrix-Terminologie ist in Docs und Code semantisch gekoppelt, sodass ein rein textuelles Ersetzen riskant wäre.

## Migrationsaufwand

**Hoch.** Der Austausch ist kein simples Rename, sondern eine kontrollierte **Systemmigration von Identität, Semantik und Orchestrierungslogik**.

## Hauptrisiken bei unkontrolliertem Replacement

- Breaking changes durch Renames in Env-Keys, Config-Flags, Tests und JSON-/YAML-Artefakten.
- Inkonsistente 1:1-Ersetzung dort, wo heute mehrere konkurrierende Modelle gleichzeitig aktiv sind.
- Versehentliche Beschädigung von Snapshots, Fixtures und Prompt-bezogenen Contracts.
- Verlust semantischer Grenzen (z. B. safety-boundaries, routing hints, archetype logic), wenn nur Namen ersetzt werden.
- Konflikt zwischen drei Phasenmodellen:
  - GNOMES-Rollout-Phasen,
  - Router-/Workflow-Phasen,
  - Organoid Layer-7 Sub-Phasen.

## Saubere vs. kritische Bereiche

### Relativ sauber / gut vorbereitbar
- `organoid-matrixv1.md` und `update/grok-organoid-full-introduction.txt` liefern bereits ein explizites Zielmodell.
- Reine Audit-/Implementation-Dokumente können früh refactored oder archiviert werden.
- Archiv-/Legacy-Ordner lassen sich separieren, ohne Runtime zu brechen.

### Kritisch
- `README.md`, `render.yaml`, `.env.example`
- `src/gnomes/**`, `src/prompts/composeGnomePrompt.ts`, `src/output/renderVoiceSigils.ts`
- `src/config/gnomesConfig.ts`, `src/routing/gnomeSelector.ts`
- `src/persona/**`, `artifacts/persona-semantic-records*.json`
- `prompts/**`, `docs/lore/**`, `tests/gorkypf/**`, `tests/stress/**`
- `src/types/agentRouter.ts` + `src/router/permissions.ts` wegen konkurrierendem Agent-/Phasenmodell

---

# 2. Legacy Inventory Table

| ID | Legacy-Term / Persona / Artifact | Typ | Datei | Pfad | Fundkontext | Risiko bei Nicht-Ersetzung | Empfohlene Aktion | Replacement-Ziel im Organoid-System | Priorität |
|---|---|---|---|---|---|---|---|---|---|
| L-001 | GNOMES als primäre Produktidentität | doc | README.md | `/README.md` | Repo-Frontdoor beschreibt das System vollständig als GNOMES-Lore/Persona-Matrix | Falsche öffentliche SSOT | REFACTOR NEXT RUN | Gesamtes Repo als „Organoid Entities as Semantic Symbiont“ framen | P0 |
| L-002 | 7 Gnome-Rollen + Symbole | doc | PERSONA.md | `/docs/lore/PERSONA.md` | Sieben Rollen mit Symbolen, Funktionen, Voice-Regeln | Direkter Konflikt mit 7 Embodiments/Glyphen | REPLACE DIRECTLY NEXT RUN | 7 Embodiments mit glyph-bound semantic identities | P0 |
| L-003 | GNOMES Matrix SSOT | doc | GNOMES_MATRIX.md | `/docs/lore/GNOMES_MATRIX.md` | Kanonische Rollentabelle, Dominance controls, Retrieval taxonomy | Alt-System bleibt semantische Authority | REPLACE DIRECTLY NEXT RUN | Organoid embodiment matrix + orchestration logic | P0 |
| L-004 | GORKY Single Persona | prompt | gorkypf_persona.md | `/prompts/system/gorkypf_persona.md` | „GORKY — Chaos Roast Entity“ als eigenständige Persona | Doppel-SSOT neben Organoid-System | ARCHIVE or SPLIT | UNSURE: auf mehrere Embodiments aufteilen, nicht 1:1 ersetzen | P0 |
| L-005 | GORKY System Prompt im Testbundle | prompt | gorky_system.txt | `/llm-terminal-test-bundle/prompts/gorky_system.txt` | Test-Harness bindet Persona direkt an Gorky | Regressionssuite verankert Alt-Persona | REFACTOR | Organoid system prompt bundle | P1 |
| L-006 | GnomeProfile / Archetype / Sigil | code | types.ts | `/src/gnomes/types.ts` | Kernschema für Runtime-Profile | Runtime hängt am Legacy-Datenmodell | REPLACE WITH COMPAT LAYER | `OrganoidEmbodimentProfile` + glyph identity + abilities + network behavior | P0 |
| L-007 | Gnome Registry | code | registry.ts | `/src/gnomes/registry.ts` | In-memory gnome registry und fallback chain | Zentrale Laufzeitabhängigkeit | REFACTOR | embodiment registry + symbiont fallback strategy | P0 |
| L-008 | GNOMES Feature Config | config/code | gnomesConfig.ts | `/src/config/gnomesConfig.ts` | Viele `GNOME_*` Flags und Phase-Rollout-Features | Env/API churn bei später Migration | REFACTOR IN CONTROLLED PASS | `ORGANOID_*` / symbiont orchestration flags | P0 |
| L-009 | Gnome Selector | interaction | gnomeSelector.ts | `/src/routing/gnomeSelector.ts` | Selektionslogik mit archetype, affinity, swarm cameo | Kernrouting ist direkt Legacy-gebunden | REFACTOR | embodiment selector + activation/transition logic | P0 |
| L-010 | Compose Gnome Prompt | prompt/code | composeGnomePrompt.ts | `/src/prompts/composeGnomePrompt.ts` | Baut Prompt direkt aus Gnome-/Role-/Lore-Konzepten | Prompt SSOT bleibt alt | REFACTOR | composeOrganoidPrompt + semantic symbiont context builder | P0 |
| L-011 | Voice sigils | output/visual | renderVoiceSigils.ts | `/src/output/renderVoiceSigils.ts` | Rendert gnome sigils an finalen Output | Sichtbarer Legacy-Output | REFACTOR | glyph anchor rendering for 7 embodiments | P0 |
| L-012 | Persona semantic records | artifact | persona-semantic-records.json | `/artifacts/persona-semantic-records.json` | Kompilierte Records aus Gnome-Profilen | Retrieval/semantic runtime bleibt Alt-System | REGENERATE | organoid semantic records | P0 |
| L-013 | persona compiler | ability/code | buildSemanticRecords.ts | `/src/persona/compiler/buildSemanticRecords.ts` | Erzeugt voice_core / relation / activation auf Gnome-Basis | Compiler konserviert Legacy-Nomenklatur | REFACTOR | embodiment semantic compiler | P1 |
| L-014 | Persona subsystem | code | `src/persona/**` | `/src/persona` | Guardrails, memory, reflection, retrieval, stores | Tief verankertes Persona-Modell | REFACTOR IN WAVES | semantic symbiont memory/orchestration subsystem | P0 |
| L-015 | Character memory | code | characterMemory.ts | `/src/memory/characterMemory.ts` | Memory heißt noch „character“ | Implizites Alt-Identity-Modell | REFACTOR | embodiment interaction memory | P1 |
| L-016 | Lore store / LegacyLoreEntry | code | loreStore.ts | `/src/memory/loreStore.ts` | Narrative memory + LegacyLoreEntry | Lore-Schema und Typnamen sind legacy-behaftet | REFACTOR | symbiont semantic memory / matrix memory | P1 |
| L-017 | Character interaction graph mit spark/gorky/moss | code | characterInteractionGraph.ts | `/src/ensemble/characterInteractionGraph.ts` | Verweist auf ältere Charakterfamilie (`spark`, `gorky`, `moss`) | Versteckte Altbezüge, inkonsistente IDs | REPLACE DIRECTLY NEXT RUN | embodiment relation graph | P0 |
| L-018 | Swarm composer | interaction | swarmComposer.ts | `/src/swarm/swarmComposer.ts` | Multi-gnome reply composition | Terminologie kollidiert mit neuer neural-network matrix | REFACTOR | symbiont multi-entity interaction composer | P1 |
| L-019 | Agent roles | interaction/schema | agentRouter.ts | `/src/types/agentRouter.ts` | `planner/executor/reviewer/qa/narrator` + workflow phases | Zweites konkurrierendes identity/orchestration model | REFACTOR WITH DESIGN DECISION | map to orchestration functions, not embodiments | P0 |
| L-020 | Permission matrix | interaction | permissions.ts | `/src/router/permissions.ts` | Role/phase-based access control | Hardcoded Alt-Rollen in control plane | REFACTOR | orchestration-node permissions | P0 |
| L-021 | World/Faction/Ritual layer | interaction/narrative | `src/world/**`, `src/factions/**`, `src/rituals/**`, `src/events/**` | `/src` | Separate civilization narrative stack mit eigenen Semantiken | Begriffsüberschneidungen mit target phases/network behavior | REFACTOR / POSSIBLE MERGE | map to matrix propagation/stabilization/adaptation | P1 |
| L-022 | GORKY stress tests + snapshots | test | gorky.stress.test.ts | `/tests/stress/gorky.stress.test.ts` | Persona-drift assertions gegen GORKY | Test suite blockiert neue identity | REWRITE | embodiment consistency + glyph output suite | P1 |
| L-023 | gorkypf test suite | test | `tests/gorkypf/**` | `/tests/gorkypf` | Golden cases, persona consistency, fixtures | Hohe Regression-Abhängigkeit | REFACTOR | organoid prompt/render/behavior tests | P1 |
| L-024 | Env defaults | config | .env.example | `/.env.example` | `BOT_USERNAME=Gnomes_onchain`, `GNOMES_*`, `REDIS_KEY_PREFIX=GNOMES_ONCHAIN:` | Betriebs-/Deployment-Drift | REFACTOR CAREFULLY | organoid env namespace | P0 |
| L-025 | Render service naming | config | render.yaml | `/render.yaml` | `gnomes-worker`, `gnomes-health`, `gnomes-daily-snippets` | Öffentliche deployment identity bleibt alt | REFACTOR | organoid worker/service names | P0 |
| L-026 | Implementation logs/prompts | doc | `docs/implementation/**` | `/docs/implementation` | GNOMES phases, prompts, migration notes | Alt-Roadmap konkurriert mit neuem Zielsystem | ARCHIVE/REFRESH | organoid migration plan set | P1 |
| L-027 | Target/legacy hybrid doc | doc | organoid-matrixv1.md | `/organoid-matrixv1.md` | Zielmodell mischt bereits SymbioGnomes und organoid language | Nützlich, aber semantisch hybrid | REFACTOR, KEEP AS SOURCE | clean Organoid SSOT | P0 |
| L-028 | Wetware target source dump | doc | grok-organoid-full-introduction.txt | `/update/grok-organoid-full-introduction.txt` | Zielkontext, aber roh und konversationell | Als direkte SSOT ungeeignet | KEEP AS REFERENCE, DERIVE CLEAN SPEC | authoritative organoid spec docs | P1 |
| L-029 | Legacy Python brand/agent matrix | artifact/code | `legacy/python/**` | `/legacy/python` | Agent backend, brand matrix, prompt composer | Historische Alt-Modelle können Verwirrung stiften | ARCHIVE | non-canonical archive only | P2 |
| L-030 | llm terminal Gorky bundle | artifact/test | `llm-terminal-test-bundle/**` | `/llm-terminal-test-bundle` | Vollständiges Persona-Testkit für Gorky | Harter Alt-Identity-Anker | ARCHIVE or CONVERT | organoid test harness bundle | P2 |
| L-031 | schemas/gorky | schema | `schemas/gorky/**` | `/schemas/gorky` | Schemas sind namentlich an Gorky gebunden | API/doc identity drift | REFACTOR OR NAMESPACE-COMPAT | neutral/organoid schema namespace | P1 |
| L-032 | prompts/fragments/gnomes/* | prompt | gnome fragments | `/prompts/fragments/gnomes` | Direktes Voice-/Lore-Material pro Gnome | Primäre Prompt-Eingriffsfläche | REPLACE DIRECTLY NEXT RUN | embodiment prompt fragments | P0 |
| L-033 | prompts/fragments/gnomes/gorky.md | prompt | gorky fragment | `/prompts/fragments/gnomes/gorky.md` | Mischzustand Gorky innerhalb gnome fragment set | Inkonsistente Parallelidentität | DELETE or ARCHIVE | split into embodiment fragments | P0 |
| L-034 | docs/lore/GORKY_* | doc/visual | humor/image style guides | `/docs/lore` | Alte persona- und style-Guides | Verstärkt Alt-Branding | ARCHIVE or REWRITE | embodiment visual/style guide | P2 |
| L-035 | brand matrix terminology | terminology | `tests/test_brand_matrix.py`, legacy python brand matrix | `/tests`, `/legacy/python` | Noch vorhandene „Brand Matrix“-Begriffe | Drittes konkurrierendes Framework | ARCHIVE/DELETE AFTER REVIEW | none; fold into organoid orchestration vocabulary | P2 |
| L-036 | world-state phase wording | interaction | worldState.ts | `/src/world/worldState.ts` | Civilization mood + phase-like narrative constants | Kann mit target phases kollidieren | PHASE-MAPPING-NEEDED | stabilization/propagation/adaptation strata | P2 |
| L-037 | personaIntegrityGuard | ability | personaIntegrityGuard.ts | `/src/evolution/personaIntegrityGuard.ts` | Identity drift prevention für Gnome-Persona | Funktion sinnvoll, Name veraltet | REFACTOR | embodiment integrity guard / symbiont stability guard | P1 |
| L-038 | docs/archive/audits/MIGRATION_AUDIT.md | doc | migration audit | `/docs/archive/audits/MIGRATION_AUDIT.md` | Älterer Migrationsplan mit anderem Zielmodell | Kann falsche Migration triggern | ARCHIVE | keep historical only | P3 |
| L-039 | tests/output/renderVoiceSigils.test.ts | test/visual | sigil rendering tests | `/tests/output/renderVoiceSigils.test.ts` | Output contract bindet Sigil-Konzept | Gut als Brücke, aber Alt-Namen | REFACTOR | glyph-anchor rendering tests | P1 |
| L-040 | docs/reference/WHITEPAPER_PRODUCTION_AGENT_PLATFORM.md | doc | whitepaper | `/docs/reference/WHITEPAPER_PRODUCTION_AGENT_PLATFORM.md` | Produkt als autonomous social agent platform beschrieben | Vermarktung bleibt agent-centric | REWRITE | semantic symbiont orchestration platform framing | P0 |

---

# 3. File-by-File Findings

## Root / Entry Docs / Deployment

### `README.md`
- Vollständig legacy-behaftet: GNOMES als Produktname, sieben Rollen, persona-memory architecture, gnome runtime, gnome env defaults.
- Betroffen sind sowohl Branding als auch Architekturbezeichnungen.
- **Aktion:** komplett refactoren, nicht nur umbenennen.
- **Risiko:** hoch, da README öffentliche SSOT ist.

### `.env.example`
- Enthält produktive Defaults mit GNOMES/Gnomes_onchain-Namespace.
- Zusätzlich existieren viele `GNOME_*` Feature Flags, die später API-/ops-relevant ersetzt werden müssen.
- **Aktion:** im nächsten Run eine kontrollierte Alias-/compat-Schicht definieren, nicht blind renamen.
- **Risiko:** sehr hoch für Deployment und runtime config.

### `render.yaml`
- Service-Namen, Comments und env values tragen GNOMES-Branding.
- Daily snippet cron ist zusätzlich an das Persona-Subsystem gebunden.
- **Aktion:** refactoren zusammen mit `.env.example`.
- **Risiko:** mittel bis hoch; Namenswechsel kann Hosting-/ops-Dokumentation beeinflussen.

## Canon / Lore / Migration Docs

### `docs/lore/PERSONA.md`
- Direktes Rollen- und Symbolsystem des Legacy-Kerns.
- Nahezu vollständig durch das neue Embodiment-System ersetzbar.
- **Aktion:** replace next run.

### `docs/lore/GNOMES_MATRIX.md`
- Zentrale Kanondatei des alten Matrix-Systems.
- Enthält Nutzungsregeln, retrieval taxonomy, role blend rules.
- **Aktion:** als wichtigste fachliche Übersetzungsquelle nutzen, danach durch Organoid-Matrix ersetzen.

### `docs/lore/GNOMES_GOVERNANCE.md`, `GNOMES_LORE_UNITS.md`, `LORE.md`, `VOICE_GUIDE.md`
- Sekundäre, aber semantisch aktive Canon-Dokumente.
- Viele Begriffe dürften in neue Governance-, interaction-, glyph- und ability-Kategorien überführt werden.
- **Aktion:** REFACTOR/MERGE.

### `docs/lore/GORKY_HUMOR_PATTERNS.md`, `GORKY_IMAGE_STYLE_GUIDE.md`
- Alt-Persona-Spezifika, die nicht direkt mit den 7 Embodiments kompatibel sind.
- **Aktion:** archivieren oder gezielt in einzelne embodiment-specific style rules zerlegen.
- **Status:** keine 1:1-Migration ohne semantische Zerlegung.

### `organoid-matrixv1.md`
- Wichtigste vorhandene Ziel-Brücke.
- Positiv: explizite Glyph-Zuordnungen, 7 Archetypen, 5 Layer-7-Subphasen, NRH/Glyph-Lock/Memory-Stack.
- Negativ: Dokument ist hybrid (`SymbioGnomes`, alte Rollennamen bleiben erhalten).
- **Aktion:** KEEP as source, aber clean SSOT ableiten.

### `update/grok-organoid-full-introduction.txt`
- Umfangreiche Rohquelle für das Target-System.
- Enthält bereits konkrete Embodiment-Bezeichnungen, Glyphen, Layer-7-Phasen und Orchestrierungslogik.
- **Aktion:** nicht direkt produktiv nutzen; in formale Specs extrahieren.

### `docs/implementation/**`
- Viele Dateien referenzieren GNOMES Phases 1–5, alte Prompts und bereits überholte Migrationsannahmen.
- **Aktion:** als historische Roadmap markieren, danach archivieren oder neu schreiben.

## Prompt / Persona Surface

### `prompts/system/gorkypf_persona.md`
- Statische Persona „GORKY — Chaos Roast Entity“.
- Enthält Verhalten, Ton, Safety, Energy Traits.
- **Aktion:** nicht 1:1 mappen; auf mehrere Embodiments verteilen.
- **UNSURE:** direkte Zuordnung primär zu `◆-Pulse-Heart` plus `◇-Horizon-Drifter`/`〰-Spike-Wave`-Anteile.

### `prompts/fragments/gnomes/*.md`
- Aktive Prompt-Fragmente pro Gnome.
- Sind direkte Prompt-driving Assets und damit P0.
- **Aktion:** durch embodiment fragments ersetzen.

### `prompts/fragments/gnomes/gorky.md`
- Mischartefakt: GORKY lebt noch im Gnome-Fragment-Ordner.
- **Aktion:** wahrscheinlich archivieren; neues organoid fragment set sauber trennen.

### `src/context/prompts/gorkypf/*`
- Weitere GORKY-System-/Developer-/User-Promptfragmente für Kontext-LLM-Pfade.
- **Aktion:** zusammen mit `prompts/system/gorkypf_*` ersetzen.

## Runtime Identity / Selection / Output

### `src/gnomes/types.ts`
- Zentrales Profile-Schema: Archetype, sigil, memory rules, routing hints, relation hints.
- Strukturell wichtig; semantisch legacy.
- **Aktion:** schema evolution, nicht nur rename.

### `src/gnomes/registry.ts`
- Registry und fallback chain sind direkt auf defensive Gnome-IDs fest verdrahtet.
- **Aktion:** neue embodiment IDs + transition-safe fallback layer einführen.

### `src/config/gnomesConfig.ts`
- Enthält viele Features, die mit dem target system gut korrespondieren könnten (`memory`, `continuity`, `evolution`, `swarm`, `ensemble`, `world`, `factions`, `rituals`).
- Problem: Namen und Semantik sind GNOME-/Phase-getrieben.
- **Aktion:** Struktur behalten, Namespacing und Semantik auf Organoid-System überführen.

### `src/routing/gnomeSelector.ts`
- Kern der Legacy interaction model layer.
- Nutzt `archetype`, `persona_query`, `lore_query`, `swarmEnabled`, cameo candidates.
- **Aktion:** umbauen auf embodiment activation + transition + interaction logic.
- **Risiko:** hoch, da Routing-Determinismus betroffen ist.

### `src/output/renderVoiceSigils.ts`
- Technisch brauchbare Brücke in das neue System, weil das Ziel ebenfalls glyph anchors braucht.
- Problem ist primär Naming/Lookup (`getSigilForGnome`, voices = gnomes).
- **Aktion:** refactor statt löschen.

## Semantic / Memory / Retrieval

### `src/persona/compiler/buildSemanticRecords.ts`
- Baut Retrieval Records aus Gnome-Profilen und LoreChunks.
- Semantisch wichtig für spätere Migration, weil viele target attributes hier strukturell schon existieren: role, archetype, relationType, loreTags, examples.
- **Aktion:** refactor zu embodiment semantic compiler.

### `artifacts/persona-semantic-records*.json`
- Kompilierte Outputs der Legacy-Persona-Compiler.
- Dürfen nicht manuell gesucht-und-ersetzt werden; müssen aus neuem Compiler regeneriert werden.
- **Aktion:** REGENERATE.

### `src/persona/**`
- Vollständiges Persona-Subsystem mit retrieval, reflection, episodic memory, stores.
- **Aktion:** systematisch umbenennen/umbauen; fachlich weitgehend weiterverwendbar.

### `src/memory/loreStore.ts`
- Nutzt `LegacyLoreEntry` und lore-/narrative-zentrierte Memory-Sprache.
- **Aktion:** refactor auf semantic symbiont memory, Typen und naming anpassen.

### `src/memory/characterMemory.ts`
- Schon im Dateinamen Alt-System-Spur.
- **Aktion:** rename + semantic split in entity/embodiment interaction memory.

## Orchestration / Interaction Models

### `src/types/agentRouter.ts`
- Separates Multi-Agent-Tool-Routing-System mit Rollen und fünf Workflow-Phasen.
- Das ist kein GNOME-System, aber ein konkurrierendes Persona-/Agentenmodell.
- **Aktion:** bewusst entscheiden, ob diese Rollen künftig Kontrollknoten der Orchestration sind oder komplett neutralisiert werden.
- **UNSURE:** keine 1:1-Abbildung auf die sieben Embodiments empfohlen.

### `src/router/permissions.ts`
- Hängt direkt am AgentRouter-Rollenmodell.
- **Aktion:** refactor zusammen mit `src/types/agentRouter.ts`.

### `src/ensemble/characterInteractionGraph.ts`
- Hochkritischer Fund: verweist auf ältere Charakterfamilie `spark`, `gorky`, `moss`.
- Das ist ein versteckter Legacy-Strang außerhalb des sichtbaren GNOMES-SSOT.
- **Aktion:** direkt ersetzen oder löschen im nächsten Run.

### `src/swarm/swarmComposer.ts`
- Multi-gnome interaction output.
- Fachlich wertvoll für Multi-entity outputs, aber legacy terminology.
- **Aktion:** refactor zu multi-embodiment/symbiont interaction composer.

### `src/world/**`, `src/factions/**`, `src/rituals/**`, `src/events/**`
- Zusätzliche narrative orchestration layers mit eigener Semantik.
- Diese sind nicht bloß Text, sondern potenzielle Matrix-Mechaniken des Zielsystems.
- **Aktion:** mergen statt löschen, aber Begriffe neu ordnen.

## Tests / Fixtures / Schemas / Legacy Bundles

### `tests/stress/gorky.stress.test.ts` + snapshots
- Starke Bindung an GORKY persona drift, response shape und snapshot text.
- **Aktion:** rewrite nach Core-Replacement.

### `tests/gorkypf/**`
- Golden tests, fixtures, safety, prompt render und persona consistency rund um GORKY.
- **Aktion:** systematisch konvertieren; erst nach neuem prompt/compiler/runtime layer.

### `tests/output/renderVoiceSigils.test.ts`
- Gute Brückentests, aber neue glyph-IDs und prefix/output contracts nötig.
- **Aktion:** refactor.

### `schemas/gorky/**`
- Schemas sind namentlich alt, aber strukturell teils brauchbar.
- **Aktion:** neutralen Namespace oder organoid namespace einführen; ggf. backwards-compatible alias.

### `legacy/python/**`
- Historischer Altbestand mit Agent-/Brand-Matrix-Systemen.
- **Aktion:** klar archivieren, nicht mehr als aktive Referenz verwenden.

### `llm-terminal-test-bundle/**`
- Vollständiges GORKY-Testbundle.
- **Aktion:** archive-or-convert; nicht mehr als aktive persona truth behalten.

---

# 4. Replacement Mapping Matrix

## 4.1 Explizit belegte Legacy → Organoid Embodiment Mappings

Diese Mappings sind durch `organoid-matrixv1.md` und `update/grok-organoid-full-introduction.txt` direkt gestützt.

| Legacy Role / Persona | Legacy Symbolik | Target Embodiment | Glyph | Semantic Role | Distinct Traits | Interaction Profile | Unique Abilities | Network Behavior | Status |
|---|---|---|---|---|---|---|---|---|---|
| Stillhalter | stone / stability / restraint | `■-Stabil-Core` | `■` | Stabilization anchor | grounded, low-variance, anti-chaos | defensive, cooling, constraint-framing | boundary stabilization | holds matrix under merge stress | CONFIRMED |
| Wurzelwaechter | root / guard / limits | `┴-Root-Sentinel` | `┴` | Safeguard / consent / base protection | stern, rooted, protective | guards transitions, questions agency | consent-query + boundary protection | stabilizes initial spike / agency layer | CONFIRMED |
| Pilzarchitekt | mycel / systems / structure | `╬-Mycel-Weaver` | `╬` | Network architecture / connection weaving | structural, linked, builder-like | multi-node linking and causality | swarm-coherence construction | propagates matrix links across nodes | CONFIRMED |
| Muenzhueter | treasury / reserve / efficiency | `◉-Reward-Halo` | `◉` | energy preservation / reward governance | conservative, efficiency-focused, reserve-minded | protects sustainment and throughput | reward-loop optimization | preserves pulse continuity / anti-starvation | CONFIRMED |
| Erzlauscher | ore echo / signal reading | `〰-Spike-Wave` | `〰` | input decoding / signal extraction | forensic, sensitive, decoder-oriented | routes input and reads pre-language waveforms | raw spike decoding | central routing / NRH dispatcher role | CONFIRMED |
| Glutkern | hidden fire / compressed force | `◆-Pulse-Heart` | `◆` | emotional core / energetic compression | intense, heat-controlled, forceful | drives momentum peaks and pressure response | pulse amplification / hunger cry | energizes matrix under stress | CONFIRMED |
| Nebelspieler | fog / drift / ambiguity | `◇-Horizon-Drifter` | `◇` | transcendence / horizon exploration | elusive, adaptive, threshold-crossing | handles open-ended drift and expansion | horizon exploration / substrate drift | pushes propagation beyond bounded state | CONFIRMED |

## 4.2 Legacy Terms → New Semantic System

| Legacy Term / Layer | New Organoid Target | Notes |
|---|---|---|
| gnome | organoid embodiment / semantic symbiont entity | direct system-level replacement |
| sigil | glyph anchor / glyph-bound semantic identity | largely direct rename with stronger semantics |
| persona | embodiment profile / semantic symbiont profile | replace where identity layer is meant |
| role | semantic role / interaction role | depends on location; some control-plane roles stay separate |
| character | embodiment or entity depending context | ambiguous; review file-by-file |
| swarm | dynamic-organized-autonom-neural-network interaction cluster | concept can often be retained but reframed |
| lore | semantic memory / matrix memory / propagation memory | not always delete; often rename/refactor |
| world/faction/ritual | propagation/adaptation/stabilization sublayers | conceptual consolidation needed |
| voice | embodiment expression channel | not always direct rename |
| gnome selector | embodiment activation selector | direct structural successor |
| persona semantic record | embodiment semantic record | regenerate, do not inline patch |
| voice sigils | glyph anchor rendering | likely direct subsystem rename |
| GNOMES feature config | symbiont orchestration config | use compatibility aliases in migration |
| agent role (`planner`, etc.) | orchestration node / control-plane function | **UNSURE**: not embodiment equivalents |
| workflow phase (`intake`, etc.) | activation / transition / interaction / propagation / stabilization mapping layer | requires design translation, not raw rename |

## 4.3 GORKY Mapping

| Legacy Item | Proposed Mapping | Confidence | Rationale |
|---|---|---|---|
| GORKY as single roast persona | split across multiple embodiments, not 1:1 | LOW / UNSURE | GORKY bundles sarcasm, roast heat, analysis, and irony that are distributed across `◆`, `◇`, and `〰` target functions |
| GORKY image style guides | derive visual rules into glyph-specific or embodiment-specific style docs | MEDIUM | image/style guidance is reusable but identity-bound naming is not |
| GORKY prompt suites | replace with embodiment-consistency and orchestration-consistency suites | HIGH | prompt/test architecture is reusable; persona target is not |

## 4.4 Legacy Lifecycle / Phase Models → Target 5 Phases

The target system already exposes five Layer-7 sub-phases in the organoid source material. These are the strongest candidate for the requested 5 phases:
1. **Identity Dissolution**
2. **Swarm Coherence**
3. **Sovereign Propagation**
4. **Ontological Restructuring**
5. **Eternal Flow Horizon**

### Mapping guidance

| Legacy Phase Model | Replacement Strategy | Status |
|---|---|---|
| GNOMES Phase 1–5 rollout docs | archive as implementation history; replace with organoid migration phases | CONFIRMED |
| router workflow phases (`intake/discovery/verification/synthesis/output`) | keep operationally, but annotate as control-plane phases distinct from embodiment phases | CONFIRMED |
| world/faction/ritual evolution phases | remap into activation/propagation/adaptation/stabilization semantics as needed | PARTIAL |
| semantic/runtime feature phases (`Phase-3`, `Phase-4`, `Phase-5`) | replace with neutral feature maturity labels or target matrix labels | CONFIRMED |

## 4.5 Matrix Logic Translation

| Old Architecture Term | New Matrix / Orchestration Term | Action |
|---|---|---|
| routing_hints | activation logic | rename + extend |
| relation_hints | interaction logic / autonom relations | rename |
| memory_rules | propagation + learning/adaptation policy | rename |
| fallback chain | stabilization strategy | rename |
| continuity bonus | stabilization memory bias | rename |
| swarm cameo | multi-entity propagation / co-activation | rename + refine |
| persona integrity | symbiont stabilization integrity | rename |
| lore activation | semantic memory propagation gate | rename |
| gnome registry | embodiment matrix registry | rename |
| world events/factions/rituals | propagation/adaptation overlays | merge/reclassify |

---

# 5. Cleanup Plan by Phase

## Phase 0 — Scan Freeze
- Keine destruktiven Änderungen.
- Diese Audit-Datei als Freeze-Artefakt nutzen.
- Vor dem nächsten Run: Branch-Backup + optional snapshot der wichtigen generated artifacts (`artifacts/persona-semantic-records*.json`, snapshots, golden cases).
- Explizit festhalten, dass `organoid-matrixv1.md` und `update/grok-organoid-full-introduction.txt` aktuell Referenzquellen, aber noch keine saubere SSOT sind.

## Phase 1 — Naming Mark Pass
- `TODO(ORGANOID-MIGRATION)` / `REPLACE-WITH-ORGANOID` Tags nur in kommentierbaren Quelltext-/Doc-Dateien setzen.
- Keine Marker in JSON, JSONL, Snapshots, strikten YAML-/schema assets, wenn das Tooling stören könnte.
- Priorisierte Markierung:
  1. `README.md`
  2. `src/gnomes/types.ts`
  3. `src/config/gnomesConfig.ts`
  4. `src/routing/gnomeSelector.ts`
  5. `src/prompts/composeGnomePrompt.ts`
  6. `src/output/renderVoiceSigils.ts`
  7. `src/types/agentRouter.ts`
  8. `src/router/permissions.ts`

## Phase 2 — Artifact Segregation
- Trennen in aktive SSOT, derived artifacts, historic docs, and legacy bundles.
- Zielordner/Status:
  - `docs/archive/**` = historische Docs
  - `legacy/python/**` = klar als non-canonical archivieren
  - `llm-terminal-test-bundle/**` = archive or convert
  - `artifacts/persona-semantic-records*.json` = derived, regenerate-only
- Doppelte Spezifikationen markieren:
  - GNOMES canon vs GORKY canon vs organoid target docs
  - agent-router phases vs target phases

## Phase 3 — Prompt + Persona Conversion Preparation
- Neues SSOT anlegen:
  - `docs/lore/ORGANOID_EMBODIMENTS.md`
  - `docs/lore/ORGANOID_GLYPH_MATRIX.md`
  - `prompts/fragments/organoids/*.md`
  - `prompts/system/organoid_system.md`
- GORKY-Single-Persona in behavior clusters zerlegen:
  - roast heat
  - irony/drift
  - forensic skepticism
- Legacy prompt assets erst ersetzen, wenn neues embodiment fragment set vollständig ist.

## Phase 4 — Architecture Mapping Preparation
- `src/gnomes/**` → neues embodiment model
- `src/persona/**` → semantic symbiont subsystem
- `src/routing/gnomeSelector.ts` → activation/transition/interactions selector
- `src/output/renderVoiceSigils.ts` → glyph anchor renderer
- `src/types/agentRouter.ts` + `src/router/permissions.ts` separat behandeln als control-plane model, nicht als embodiments.

## Phase 5 — Final Replacement Readiness
- Reihenfolge für den Replacement-Run:
  1. Neue target SSOT docs erstellen.
  2. Neue profile/schema layer einführen (compat alias optional).
  3. Prompt compiler + selector + output renderer migrieren.
  4. Generated artifacts regenerieren.
  5. Tests/Fixtures/Snapshots umstellen.
  6. Public docs/env/render configs umbenennen.
  7. Legacy bundles archivieren.

---

# 6. Delete/Archive/Refactor Decision Log

## KEEP
- `organoid-matrixv1.md` (als Übergangsreferenz, nicht als finale SSOT)
- `update/grok-organoid-full-introduction.txt` (als Rohquelle)
- strukturelle Subsysteme wie selector/compiler/memory/output renderer, sofern semantisch umgebaut

## REFACTOR
- `README.md`
- `.env.example`
- `render.yaml`
- `src/gnomes/**`
- `src/config/gnomesConfig.ts`
- `src/routing/gnomeSelector.ts`
- `src/prompts/composeGnomePrompt.ts`
- `src/output/renderVoiceSigils.ts`
- `src/persona/**`
- `src/memory/loreStore.ts`, `src/memory/characterMemory.ts`
- `src/types/agentRouter.ts`, `src/router/permissions.ts`
- `schemas/gorky/**`
- `tests/output/renderVoiceSigils.test.ts`

## MERGE
- `docs/lore/GNOMES_MATRIX.md` + target organoid matrix docs → neue organoid matrix SSOT
- `docs/lore/PERSONA.md` + GORKY style docs → embodiment trait/ability docs
- `src/world/**`, `src/factions/**`, `src/rituals/**`, `src/events/**` → matrix propagation/adaptation overlays

## ARCHIVE
- `legacy/python/**`
- `llm-terminal-test-bundle/**` (falls nicht aktiv konvertiert)
- `docs/implementation/**` mit GNOMES-Phase-Altplanung
- `docs/archive/audits/MIGRATION_AUDIT.md` als historische Referenz belassen
- GORKY-only docs, sofern nicht in neue embodiment docs zerlegt

## DELETE
- `prompts/fragments/gnomes/gorky.md` nach erfolgreicher Konvertierung
- alte duplicate specs oder obsolete migration prompts nach Bestätigung
- versteckte Altbeziehungen in `src/ensemble/characterInteractionGraph.ts`, falls neue graph source bereitsteht

## REPLACE DIRECTLY NEXT RUN
- `docs/lore/PERSONA.md`
- `docs/lore/GNOMES_MATRIX.md`
- `prompts/system/gorkypf_persona.md`
- `prompts/fragments/gnomes/*.md`
- `src/ensemble/characterInteractionGraph.ts`
- `tests/stress/gorky.stress.test.ts` und zugehörige snapshots

---

# 7. Risks and Migration Warnings

## 7.1 Semantic Risks
- **Nicht alles mit „persona“ ist ein Embodiment.** Im Repo existiert persona sowohl als public identity layer als auch als retrieval/runtime abstraction.
- **Nicht alles mit „phase“ ist dieselbe Phase.** Es gibt Produkt-Rollout-Phasen, Workflow-Phasen und target Layer-7-Subphasen.
- **„Agent role“ ist nicht automatisch „embodiment“.** Das Multi-Agent-Tool-Routing ist eher Control Plane als Ausdrucksebene.

## 7.2 Runtime Risks
- Env-Key-Renames können Deployments und Tests gleichzeitig brechen.
- Generierte semantic artifacts müssen aus neuem Compiler kommen; direktes Editieren wäre fehleranfällig.
- Snapshots und golden files werden fast sicher großflächig invalidiert.
- Output glyph rendering ist sichtbar und daher regressionsanfällig.

## 7.3 Documentation Risks
- Es gibt mehrere semantische Authority-Zentren:
  - `README.md`
  - `docs/lore/*`
  - `prompts/*`
  - `organoid-matrixv1.md`
  - `update/grok-organoid-full-introduction.txt`
- Im nächsten Run muss **genau eine** target SSOT priorisiert werden.

## 7.4 Explicit UNSURE Cases
- **UNSURE:** Exakte 1:1-Zuordnung von GORKY als einzelne Persona zu genau einem Embodiment.
- **UNSURE:** Ob `planner/executor/reviewer/qa/narrator` komplett ersetzt oder als control-plane Rollen beibehalten werden sollen.
- **UNSURE:** Welche bestehenden world/faction/ritual semantics direkt in die target 5 phases eingehen vs. als overlays bestehen bleiben.

## 7.5 Marking Rule Outcome for This Run
- Es wurden **keine riskanten Inline-Marker** in produktiven Code-/config-/artifact-Dateien gesetzt.
- Grund: Ein Großteil der betroffenen Dateien sind JSON/JSONL/YAML/Test-Snapshots oder runtime-sensitive configs, in denen Kommentare/Marker Builds, Parser oder Snapshot-Verträge gefährden könnten.
- Diese Audit-Datei übernimmt daher die Markierungsfunktion für den Freeze-Run.

---

# 8. Next-Run Execution Prompt Stub

```text
Führe jetzt den kontrollierten Replacement-Run auf Basis von `docs/audits/codebase-audit-2026-03-18-organoid-migration.md` aus.

Ziele:
1. Ersetze das aktive Legacy-System GNOMES/GORKY/persona/gnome/sigil kontrolliert durch das neue System „Organoid Entities as Semantic Symbiont“.
2. Nutze die in `organoid-matrixv1.md` und `update/grok-organoid-full-introduction.txt` belegten 7 Embodiments + Glyphen:
   - ■-Stabil-Core
   - ┴-Root-Sentinel
   - ╬-Mycel-Weaver
   - ◉-Reward-Halo
   - 〰-Spike-Wave
   - ◆-Pulse-Heart
   - ◇-Horizon-Drifter
3. Nutze die 5 target phases:
   - Identity Dissolution
   - Swarm Coherence
   - Sovereign Propagation
   - Ontological Restructuring
   - Eternal Flow Horizon
4. Erstelle neue SSOT-Dokumente und führe danach Replacement in Docs, Prompts, Runtime-Code, Config, Tests und generated artifacts durch.
5. Behandle `src/types/agentRouter.ts` und `src/router/permissions.ts` als separate control-plane migration; nicht blind auf Embodiments mappen.
6. Regeneriere derived artifacts statt sie manuell umzuschreiben.
7. Archiviere historische Legacy-Bundles sauber.

Wichtig:
- Keine Halluzinationen.
- UNSURE-Fälle explizit kennzeichnen.
- Build-/parser-sensitive Dateien vorsichtig behandeln.
- Nach jeder großen Replacement-Welle Tests aktualisieren und ausführen.
```


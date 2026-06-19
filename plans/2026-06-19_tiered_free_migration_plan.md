# Tiered Free-Stack Migration — Execution Plan

**Datum:** 2026-06-19
**Repo:** `baum777/organoid_Symbionts` (working dir)
**Plan-Owner:** Planner Agent
**Input-Dokumente:** `~/Downloads/migration_spec.md`, `~/Downloads/evaluation_suite_spec.md`, `~/Downloads/openrouter_free_models_shortlist.md`
**Status:** ready-to-implement (First Slice = eval-suite fixtures + scorer foundation, siehe §3)

---

## 1. Executive Summary

Diese Migration ersetzt die xAI-Grok-3-Single-Point-of-Failure in der LLM-Pipeline durch eine **3-Tier-Architektur** (Pre-LLM → Reasoning → Generation) auf OpenRouter-Free-Modellen, mit xAI Grok-3 als Paid-Last-Resort. Self-Hosted LFM2.5-1.2B via Ollama-Sidecar ist Tier-0 für hochfrequente, latenz-kritische Klassifikations-Calls. Ziel: ≥70 % LLM-Cost-Reduction bei ≥90 %/85 %/75 % Pass-Rate pro Tier (Pre-LLM/Reasoning/Generation).

**Headline-Risk:** OpenRouter-Free-Tier hat ein **kombiniertes Rate-Limit von 20 req/min über alle Free-Modelle** — die Eval-Suite (47+ Fixtures × N Modelle = ≥ 235 Calls) braucht sequenzielles Throttling, sonst produziert der Eval-Run 429-Storm und liefert keine belastbaren Daten für die Go/No-Go-Kriterien der Phasen 1–3.

**Kopplungs-Hot-Spots:** (a) `LLMProvider`-Typ in `src/clients/llmClient.ts:5` ist eine 3-Werte-Union und muss erweitert werden, **bevor** irgendein neuer Adapter kompiliert. (b) `getProviderClient()` in `src/clients/llmProviderResolver.ts:31` ist der einzige Switch-Punkt für alle Tier-Provider. (c) Die Eval-Fixtures für `pre_llm` existieren bereits (`llm_test_database_bundle/eval_suite/pre_llm_classifier.jsonl`, 18 Fixtures), aber Reasoning- und Generation-Fixtures fehlen — und ohne vollständige Suite lässt sich kein Tier-Go/No-Go fällen.

**Kontroll-Beobachtung:** Aktuelle `render.yaml:55-56` hat `LLM_PROVIDER=xai` und `XAI_MODEL_PRIMARY=grok-3`. `EMBODIMENT_ORCHESTRATION_ENABLED=false` (Zeile 74). Phase-1-Adapter dürfen diese Defaults nicht verändern, bis Phase 1 abgenommen ist.

---

## 2. Dependency Graph

Pfeile sind "`A` blockiert `B`" — d.h. B kann nicht starten, bevor A fertig+grün ist. **(B)** = blocking, **(S)** = soft (Reihenfolge empfohlen, aber technisch unabhängig).

```
  (a) eval fixtures ─────────────────────────────────────────┐
      pre_llm_classifier.jsonl  ✅ exists (18 fx)            │
      reasoning_orchestrator.jsonl ❌                        │
      generation_embodiment_voice.jsonl ❌                    │
      voice_judge_prompt.txt ❌                              │
                                                           │
  (b) eval runner / scorer / adapters ─────────────────────►│
      scripts/eval_run.ts (orchestrator)                    │
      scripts/eval_adapters.ts (per-model wrappers)         │
      scripts/eval_scorer.ts (rubrics: json_schema_match,   │
                              embodiment_voice_v1)           │
                                                           │
  (c) OpenRouter adapters per tier ────────────────────────►│
      lfm25.local.ts (Ollama sidecar)                       │
      openrouterLfm25.ts (cloud fallback)                   │
      openrouterDeepseek.ts, openrouterQwen.ts,            │
      openrouterLlama.ts, openrouterDolphinVenice.ts        │
                                                           │
  (d) env schema ──────────────────────────────────────────►│
      envSchema.ts:41 enum ext (LLMProvider + tier-vars)   │
      .env.example (OPENROUTER_API_KEY, LFM25_LOCAL_URL)    │
                                                           │
  (e) provider resolver wiring ────────────────────────────►│
      LLMProvider type in src/clients/llmClient.ts:5       │
      getProviderClient() in llmProviderResolver.ts:31      │
      withProviderFallback() in llmFallback.ts:4            │
                                                           │
  (f) pipeline integration ────────────────────────────────►│
      src/canonical/pipeline.ts (pre-LLM step, tier-select) │
      src/canonical/promptBuilder.ts (gen provider-select)  │
      src/canonical/preLLMClassifier.ts (NEW)               │
      src/canonical/prompts/embodimentVoiceWrapper.ts (NEW) │
                                                           │
  (g) Ollama sidecar / render.yaml ────────────────────────►│
      Dockerfile.ollama (NEW)                              │
      render.yaml:7-90 (new ollama-lfm25 worker service)   │
      pipeline integration (workers can reach ollama-lfm25) │
                                                           │
  (h) monitoring hooks ────────────────────────────────────►│
      metricTypes.ts:6-90 (add COUNTER/GAUGE/HISTOGRAM)    │
      metrics.ts:36-49 (counter & histogram calls in code) │
      src/ops/llmCircuitBreaker.ts:11-13 (threshold tuning) │
                                                           │
  (i) docs / runbook ──────────────────────────────────────►│
      docs/operations/runbook.md (free-tier troubleshooting)│
      README.md (tier architecture section)                 │
```

### Blocking vs. Soft-Edges

| Edge | Typ | Begründung |
|---|---|---|
| (a) → (b) | **(B)** | Ohne vollständige JSONL-Fixtures kann Scorer nicht implementiert/getestet werden |
| (b) → (c) | **(S)** | Runner testet Adapter — kann theoretisch ohne alle parallel starten, aber End-to-End-Run braucht beides |
| (c) → (d) | **(B)** | Neue Adapter-Typen müssen in `LLMProvider`-Enum und `envSchema.ts:41` aufgenommen sein, sonst Type-Error |
| (d) → (e) | **(B)** | `getProviderClient()` switcht auf enum-Werte — ohne env-Schema-Erweiterung kein Provider-Resolution |
| (e) → (f) | **(B)** | Pipeline muss `createLLMClientFromEnv()` mit erweitertem Provider nutzen |
| (c) → (g) | **(S)** | Ollama-Adapter kann mit lokalem Docker getestet werden, bevor Render-Service deployed ist |
| (e) → (h) | **(S)** | Metriken können mit Mock-Provider schon committed werden, aber brauchen echte Provider für echte Werte |
| (f) → (i) | **(S)** | Runbook sollte End-to-End-Pfade dokumentieren, ist aber nicht code-blockierend |
| (a/b/c) → Phase 2 / 3 / 4 | **(B)** | Go/No-Go der Phasen ist an Pass-Rate der Eval-Suite gekoppelt |

**Kritischer Pfad:** (a) fixtures → (b) scorer → (c) adapters → (d) env-schema → (e) resolver → (f) pipeline → Phase-1-Deploy → Eval-Run (gemessen) → Phase-1-Go/No-Go → Phase 2/3.

---

## 3. First-Slice Plan (ready to implement)

### Empfehlung: **Slice A — Eval-Suite-Fixtures + Scorer-Grundlage**

**Begründung:** Die Eval-Suite ist in *beiden* Quell-Dokumenten (`migration_spec.md` §1.5, §2.5, §3.5; `evaluation_suite_spec.md` §7 Implementation-Reihenfolge) als **Phase-0-Pflicht** markiert. Ohne vollständige, lokal-ausführbare Eval-Suite (Fixtures + Scorer + Runner) ist keine der drei Phasen Go/No-Go-fähig. Konkret:

- `pre_llm_classifier.jsonl` existiert bereits (18 Fixtures) — dies ist die einzige Datei, die im Repo schon vorhanden ist. Wir erweitern die Suite um Reasoning- und Generation-Fixtures.
- Eval-Suite ist **read-only** bezüglich Produktionscode: kein Eingriff in `src/canonical/pipeline.ts`, keine neuen Adapter, keine Render-Änderungen. Dadurch **kein Production-Risk** während der Implementierung.
- Eval-Suite hat einen **klaren Pass/Fail-Mechanismus** (Pass-Rate ≥ X %, JSON-Schema-Match ≥ Y %, Latency p50 ≤ Z ms) — exakt die Form, die `migration_spec.md` §1.5, §2.5, §3.5 als Go/No-Go-Kriterium verlangt.
- **Schmalster Scope mit höchstem Information-Value**: liefert die Baseline-Daten, ohne die niemand entscheiden kann, ob DeepSeek-V3 wirklich ≥85 % Reasoning-Pass-Rate hat.

**Gegen-Argument "erstmal Ollama-Sidecar bauen" verworfen, weil:** Ein Sidecar ohne Eval-Score bringt keinen Beweis, dass LFM2.5-1.2B die 90 % Pre-LLM-Pass-Rate erreicht. Sidecar-Deployment ist außerdem infrastruktur-intensiv (Render-Plan-Upgrade, 5 GB Disk, neuer Service). Eval-Suite zuerst = **daten-getriebene** Sidecar-Entscheidung.

### Exakte Datei-Pfade (zu erstellen)

| Pfad | Zweck | Quelle |
|---|---|---|
| `llm_test_database_bundle/eval_suite/reasoning_orchestrator.jsonl` | 10–12 Fixtures (Phase-Inferenz, Resonance, Role-Plan) | eval-spec §2.2 |
| `llm_test_database_bundle/eval_suite/generation_embodiment_voice.jsonl` | 14 Fixtures (2 pro Embodiment × 7) | eval-spec §2.3 |
| `llm_test_database_bundle/eval_suite/voice_judge_prompt.txt` | LLM-als-Judge System-Prompt | eval-spec §4.2 |
| `scripts/eval_run.ts` | Multi-Model-Runner (CLI, JSON+MD-Output) | eval-spec §3.1 |
| `scripts/eval_adapters.ts` | Dünne Per-Modell-Wrapper (`LFM25Adapter`, `DeepSeekAdapter`, …) | eval-spec §3.2 |
| `scripts/eval_scorer.ts` | Rubrik-Implementierung (`json_schema_match`, `embodiment_voice_v1`) | eval-spec §3.3 |
| `tests/eval_suite/eval_scorer.test.ts` | Vitest-Tests für Scorer-Determinismus (Fixtures als Inline-Strings) | neue Test-Datei |
| `tests/eval_suite/eval_run_smoke.test.ts` | Smoke-Test: 1 Fixture × 1 Modell, kein Network-Call, mit Mock-Adapter | neue Test-Datei |
| `eval-results/.gitkeep` | Output-Verzeichnis (verhindert versehentliches Commit) | neue Datei |
| `package.json` | `eval:pre-llm`, `eval:reasoning`, `eval:generation`, `eval:all` Scripts | eval-spec §5.1 |

### Akzeptanz-Kriterien (messbar)

| Kriterium | Schwelle | Mess-Kommando |
|---|---|---|
| Fixtures gültig JSONL (1 JSON/Floats/Zeilenzahl) | 18 + 10–12 + 14 = ≥42 Fixtures, alle parse-fähig | `jq -c . llm_test_database_bundle/eval_suite/*.jsonl \| wc -l` |
| `pnpm exec tsx scripts/eval_run.ts --suite … --models … --output …` läuft End-to-End mit Mock-Provider | exit 0, JSON+MD-Output erstellt | manual + siehe §3.5 |
| Scorer-Determinismus | gleicher Input → gleicher Score, 100/100 identische Läufe | `tests/eval_suite/eval_scorer.test.ts` |
| pnpm-Scripts vorhanden und ausführbar | 4 Scripts registriert, exit 0 bei `--help` | `pnpm run \| grep eval:` |
| Eval-Run Dry-Run (1 Fixture, 1 Modell, OpenRouter-Real) | Pass-Rate dokumentiert, Latency p50 < 10s | manual Smoke |
| Voice-Score-Heuristik deterministisch (Phase 1) | Score-Variation < 0.05 zwischen 3 identischen Läufen | `tests/eval_suite/eval_scorer.test.ts` Property-Test |
| Coverage der neuen Scorer-Funktionen | Lines ≥ 85 %, Branches ≥ 80 % | `pnpm exec vitest run --coverage tests/eval_suite` |

### Geschätzter Aufwand

- Fixtures schreiben (copy aus Spec, manuell kuratieren): **3 h**
- `scripts/eval_run.ts` + `eval_adapters.ts` + `eval_scorer.ts`: **8 h**
- pnpm-Scripts + `.gitkeep` + `.env.example` Erweiterung um `OPENROUTER_API_KEY`: **1 h**
- Vitest-Tests (Determinismus + Smoke): **3 h**
- Erste Real-Run-Iteration (1 Modell, 1 Suite) + Scorer-Tuning: **4 h**
- **Total: ~19 h ≈ 2,5 Arbeitstage** (1 Entwickler, ohne Render-Deploy)

### Verifikations-Kommandos

```bash
# 1. Fixtures valid
for f in llm_test_database_bundle/eval_suite/*.jsonl; do
  jq -c . "$f" | wc -l
done

# 2. Scorer determinism
pnpm exec vitest run tests/eval_suite/eval_scorer.test.ts

# 3. Smoke-Run mit Mock-Provider
pnpm exec tsx scripts/eval_run.ts \
  --suite llm_test_database_bundle/eval_suite/pre_llm_classifier.jsonl \
  --models mock-model \
  --output eval-results/smoke

# 4. Erster Real-Run (verifiziert OpenRouter-Anbindung)
OPENROUTER_API_KEY=sk-or-... pnpm exec tsx scripts/eval_run.ts \
  --suite llm_test_database_bundle/eval_suite/pre_llm_classifier.jsonl \
  --models liquid/lfm-2.5-1.2b-instruct:free \
  --output eval-results/2026-06-19-pre-llm-lfm25

# 5. CI-Integration
# (folgt in Slice B, siehe §4)
```

### Go/No-Go für Slice A → Slice B

**GO** wenn: (1) alle Fixtures parse-fähig, (2) `eval_run.ts` exit 0 mit Mock-Provider, (3) Real-Run mit LFM2.5-Free produziert JSON+MD-Output, (4) ≥3 der 18 Pre-LLM-Fixtures passieren mit dem Mock-Provider-Test (Determinismus-Check), (5) `pnpm typecheck && pnpm lint` grün.

**NO-GO** (Rückfall auf reine Fixture-Definition ohne Runner) wenn: OpenRouter-Account-Key fehlt → dann nur Fixtures + Scorer-Stub commiten, Runner-Module als Draft.

---

## 4. Sequenced Work Breakdown

Behält Phasen 1–4 aus `migration_spec.md` bei. Pro Task: **Atomizitäts-Check** (kann isoliert committed werden?), **Verifikation** (Befehl), **Rollback** (Spec-Sektion, die den Fallback beschreibt).

### Phase 0 (Slice A, dieser Plan) — Eval-Suite-Grundlage

| Task | Atomizität | Verifikation | Rollback |
|---|---|---|---|
| 0.1 Fixtures für Reasoning + Generation | atomar (neue JSONL-Dateien) | `jq -c . ... \| wc -l` | `git rm` (Dateien waren nie in `main`) |
| 0.2 voice_judge_prompt.txt | atomar | `cat` zeigt gültige Template | trivial |
| 0.3 `scripts/eval_run.ts` | atomar (kein bestehender Code angefasst) | `pnpm exec tsx scripts/eval_run.ts --help` | revert commit |
| 0.4 `scripts/eval_adapters.ts` | atomar | typecheck | revert commit |
| 0.5 `scripts/eval_scorer.ts` | atomar | `tests/eval_suite/eval_scorer.test.ts` grün | revert commit |
| 0.6 pnpm-Scripts in `package.json` | atomar | `pnpm run \| grep eval:` | revert commit |
| 0.7 Scorer-Tests | atomar | `pnpm exec vitest run tests/eval_suite` | trivial |

**Phase-0-Rollback:** Slice A hat **keinen** Production-Code-Pfad. Jederzeitiger `git revert` ohne Downtime möglich. Spec-Ref: nicht spezifiziert (Phase 0 ist implizit aus §1.5 ableitend).

### Phase 1 (Woche 1–2) — Pre-LLM Tier (LFM2.5 + Ollama)

| Task | Atomizität | Verifikation | Rollback |
|---|---|---|---|
| 1.1 `Dockerfile.ollama` (NEW) | atomar | `docker build` lokal | file delete |
| 1.2 `render.yaml` — neuer `ollama-lfm25` worker | **nicht atomar**, gehört zu Render-Deploy | Render-Build-Log | `PIPELINE_PRE_LLM_PROVIDER=rule-based` (spec §1.6) |
| 1.3 `llmClient.lfm25.local.ts` (NEW) | atomar | `pnpm exec vitest run tests/clients/adapters/lfm25Local.test.ts` | file delete (kein anderer Code ruft den Adapter auf) |
| 1.4 `llmClient.openrouterLfm25.ts` (NEW) | atomar | `tests/clients/adapters/openrouterLfm25.test.ts` | file delete |
| 1.5 `envSchema.ts:41` — Enum-Ext + tier-vars | **nicht atomar** (Adapter 1.3+1.4 hängen ab) | `pnpm typecheck` | spec §1.6 env-vars zurücksetzen |
| 1.6 `llmProviderResolver.ts:31` — neue Cases | **nicht atomar** (braucht 1.5) | typecheck + Smoke-Test | spec §1.6 |
| 1.7 `preLLMClassifier.ts` (NEW) + rule-based Fallback | atomar | `tests/canonical/preLLMClassifier.test.ts` | file delete (Pipeline ruft noch nicht auf) |
| 1.8 `pipeline.ts:handleEvent` — Pre-LLM-Step vorangestellt | **nicht atomar**, Kern-Pipeline | spec §1.5 Go/No-Go (Pass-Rate ≥ 90 %, p50 ≤ 500ms) | spec §1.6: `PIPELINE_PRE_LLM_PROVIDER=rule-based` + Code-Rollback |
| 1.9 Public-Guard-Stress-Test (100 Fixtures) | atomar | `pnpm exec tsx scripts/test_public_guard_prefilter.ts --fixtures 100` | spec §1.6 |
| 1.10 Monitoring-Hooks (`pre_llm_*` Metriken) | atomar | `metrics.ts:36-49` + `metricTypes.ts:6-90` Erweiterung | Revert der Metrik-Definitionen |
| 1.11 Render-Deploy + Smoke | nicht atomar | `pnpm run symbiont-health-check` | spec §1.6 |

**Phase-1-Blockierung:** (1.3 + 1.4) → 1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 1.10 → 1.11
**Phase-1-Exit-Kriterium:** spec §1.5 (3 grüne Checks) + 7 Tage ohne Rollback.
**Phase-1-Rollback-Pfad:** spec §1.6 (env-Vars + Git-Revert).

### Phase 2 (Woche 3–4) — Reasoning Tier (DeepSeek + Qwen)

| Task | Atomizität | Verifikation | Rollback |
|---|---|---|---|
| 2.1 `llmClient.openrouterDeepseek.ts` (NEW) | atomar | `tests/clients/adapters/openrouterDeepseek.test.ts` | file delete |
| 2.2 `llmClient.openrouterQwen.ts` (NEW) | atomar | dito | file delete |
| 2.3 `envSchema.ts` — `PIPELINE_REASONING_*` Vars | atomar | typecheck | env zurücksetzen |
| 2.4 `llmProviderResolver.ts:31` — neue Cases | atomar | typecheck | revert |
| 2.5 `pipeline.ts` — Reasoning-Provider-Selection im LLM-Call | nicht atomar | spec §2.5 Go/No-Go (≥85 %, schema ≥ 95 %, p50 ≤ 2s) | spec §2.6 |
| 2.6 System-Prompt-Anpassung für Phase-Vokabular | atomar | eval-spec §3.1 `SYSTEM_PROMPTS.reasoning` als Vorlage | trivial |
| 2.7 Manual Voice-Review Setup (50 Samples) | nicht atomar | spec §2.5 (3) | n/a (manuell) |
| 2.8 Monitoring-Hooks (`reasoning_*` Metriken) | atomar | metrics.ts Erweiterung | trivial |
| 2.9 Render-Deploy | nicht atomar | `pnpm run symbiont-health-check` | spec §2.6 |

**Phase-2-Blockierung:** 2.1 + 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 (parallel zu 2.8) → 2.9
**Phase-2-Exit-Kriterium:** spec §2.5 (3 grüne Checks).

### Phase 3 (Woche 5–6) — Generation Tier (Llama-70B + Voice-Wrapper)

| Task | Atomizität | Verifikation | Rollback |
|---|---|---|---|
| 3.1 `llmClient.openrouterLlama.ts` (NEW, max_tokens=280) | atomar | `tests/clients/adapters/openrouterLlama.test.ts` | file delete |
| 3.2 `envSchema.ts` — `PIPELINE_GENERATION_*` + `CONSULT_GENERATION_PROVIDER` | atomar | typecheck | env zurücksetzen |
| 3.3 `promptBuilder.ts` — `selectGenerationProvider()` | atomar | typecheck | revert |
| 3.4 `embodimentVoiceWrapper.ts` (NEW, YAML-Trait-Injection) | atomar | `tests/canonical/prompts/embodimentVoiceWrapper.test.ts` | file delete |
| 3.5 `llmProviderResolver.ts:31` — Llama-70B-Case | atomar | typecheck | trivial |
| 3.6 A/B-Vergleich vs. xAI Grok-3 (50 Samples) | nicht atomar | spec §3.5 (2) | n/a |
| 3.7 Coaching-Context Smoke-Test (`/consult` in `apps/landing/src/lib/consult/`) | nicht atomar | `pnpm --filter landing test` | spec §3.6 |
| 3.8 Cost-Reduction-Tracking (xAI-Token < 60 % von Baseline) | nicht atomar | dashboard-lookup | spec §3.6 |
| 3.9 Monitoring-Hooks (`generation_*`, `consult_*`) | atomar | metrics.ts Erweiterung | trivial |
| 3.10 Render-Deploy (Worker + Landing, getrennt — Spec §1.4, §3.4) | nicht atomar | spec §3.5 (3) | spec §3.6 |

**Phase-3-Wichtiger Hinweis:** Die `CONSULT_GENERATION_PROVIDER` Env-Var gehört in den **`organoid-landing`** Service (`render.yaml:107-126`), **nicht** in den `embodiments-worker` Block. Spec §3.3.2 ist hier mehrdeutig — siehe Open Question §6.
**Phase-3-Exit-Kriterium:** spec §3.5 (4 grüne Checks).

### Phase 4 (Woche 7+) — Continuous Optimization

| Task | Atomizität | Verifikation | Rollback |
|---|---|---|---|
| 4.1 Nightly CI-Eval (`pnpm eval:all` in `.github/workflows/ci.yml`) | atomar | CI-Log | trigger disablen |
| 4.2 Monatlicher Free-Model-Review | nicht atomar | manuelle Notiz | n/a |
| 4.3 Quartalsweise Cost-Analyse | nicht atomar | dashboard-lookup | n/a |
| 4.4 Runbook-Update `docs/operations/runbook.md` | atomar | grep free-tier | trivial |

**Phase-4-Rollback:** keine Production-Änderungen. Tasks sind read-only oder CI-only.

---

## 5. Critical Risks (re-priorisiert nach tatsächlicher Kopplung)

| # | Risk | Trigger | Detection | Mitigation | Quelle |
|---|---|---|---|---|---|
| **R1** | **OpenRouter 20 req/min Rate-Limit killt Eval-Suite** (spezifiziert in shortlist §0, nicht in migration_spec) | Eval-Run > 47 Fixtures × N Modelle parallel | HTTP 429 in `scripts/eval_run.ts` Output, `OPENROUTER_RATE_LIMITED` counter | (a) Sequenzielles Throttling (1 req/s) in `eval_run.ts`, (b) `--models`-Arg nimmt max 3 Modelle, (c) Daily-Batch in CI, (d) OpenRouter-Cache-Layer für Pre-LLM-Pre-Heating | shortlist §0, §4.3 |
| **R2** | **/consult Privacy-Leak** (Coaching-Daten landen bei Free-Tier) | `CONSULT_GENERATION_PROVIDER` versehentlich auf Free-Modell gesetzt | Grep im Code: `apps/landing/src/lib/consult/` ruft Free-Provider auf, Audit-Log zeigt `model_id` aus Free-Familie | (a) `CONSULT_GENERATION_PROVIDER` Default = `xai` (nicht Free), (b) expliziter Allowlist-Block in `llmClient.unified.ts:20-34` wenn `OPENAI_CONSULT_MODE=true`, (c) Audit-Log-Alert auf `model_id~="free"` + route=`/consult` | spec §6 "Data-Retention-Klauseln" |
| **R3** | **Cold-Start-Latenz > 30s bei OpenRouter-Free** | p95 Latency in `eval-results/*.json` > 30000ms, oder Live-Reply-Time > 60s | `reasoning_latency_seconds` Histogramm, `generation_cold_start_total` Counter (spec §3.7) | (a) Pre-Warming Heartbeat (5-Min-Tick auf OpenRouter-Free-Endpoint), (b) `OLLAMA_KEEP_ALIVE=24h` in `Dockerfile.ollama` für LFM2.5-Lokal, (c) Circuit-Breaker `withTimeout` in `llmCircuitBreaker.ts:13` reduziert auf 20s | spec §1.7, §3.7, §6 |
| **R4** | **Data-Retention-Klauseln in Free-Tier** (NVIDIA-Modelle trainieren auf Prompts) | Free-Model-Anbieter-Disclosure dokumentiert "may use prompts for training" | Manuelle OpenRouter-Page-Review + model-list Check, kein automatisierter Detection-Punkt | (a) Free-Tier **nur** für anonyme Public-Mentions, **nie** für `/consult`, (b) Pre-Filter der Free-Modelle auf Whitelist in `llmProviderResolver.ts:31`, (c) Monatlicher Provider-Audit (Phase 4) | spec §6 |
| **R5** | **Provider-Rotation ohne Default-Safe-Path** | OpenRouter rotiert ein Free-Modell, alle Calls 404 | HTTP 404 in `eval_run.ts` Output, alle Production-Calls scheitern | (a) `withProviderFallback` in `llmFallback.ts:4` muss 3-stufig sein (Primary → Tier-Fallback → xAI-Last-Resort), (b) `openrouter/free` als vorletzte Stufe (spec §1.2, §4.2), (c) Failover-Test in `tests/integration/pipeline/failover.test.ts` | spec §0.2, §2.6, §3.6 |

### Sekundäre Risiken (nicht in Top-5, aber beobachtenswert)

- **R6 — Coverage-Gate-Diskrepanz:** `vitest.config.ts:46` schließt `src/clients/llmClient*.ts` aus, aber **nicht** `src/clients/adapters/llmClient.*.ts` (separate Pfad-Segment, andere Glob-Match). Spec §1.8 fordert "NICHT ausschließen" — die neuen Adapter sind per Default drin, ABER die Coverage-Schranken (85 %/80 %) sind fail-closed. Bei zu vielen ausgeschlossenen Helper-Funktionen riskieren wir den Gate.
- **R7 — `EMBODIMENT_ORCHESTRATION_ENABLED=false`:** Spec §6 listet es als "Hoch Wahrscheinlichkeit, Niedrig Impact" — bleibt bis Phase 3 auf `false`, also ist die Tier-Selection-Logik im Pipeline-Pfad effektiv inaktiv, bis Orchestration an ist. Die Eval-Suite testet die Tier-Logik unabhängig davon (über direkten Adapter-Call in `scripts/eval_run.ts`), aber die Pipeline-Integration muss `EMBODIMENT_ORCHESTRATION_ENABLED` als Gate respektieren.
- **R8 — `audit_log.jsonl` wächst unkontrolliert:** Aktuell 7 KB mit 3 Einträgen (Mittel 2.3 KB/Eintrag). Bei 10 000 Pipeline-Calls/Monat (spec §5.1) × 1 KB/Eintrag = 10 MB/Monat — kein Blocker, aber Disk-Pressure auf Render-1GB.

---

## 6. Open Questions for the Orchestrator

1. **Phase-3-Routing: welcher Service-Block bekommt `CONSULT_GENERATION_PROVIDER`?** Spec §3.3.2 listet die Variable, aber `consult/` liegt in `apps/landing/src/lib/consult/` (Separater Web-Service `organoid-landing` in `render.yaml:107-126`, **nicht** der Worker `embodiments-worker`). Die `render.yaml`-Beispiele in Spec §3.4 zeigen den Block ohne expliziten Service-Header — vermutlich ist `organoid-landing` gemeint, aber Spec sagt es nicht. **Bitte bestätigen oder korrigieren.**

2. **Eval-Suite-Runner-Konflikt mit Coverage-Gate:** `vitest.config.ts:22-69` hat Coverage-Threshold 85 %/80 % für `src/**/*.ts`. Die neuen `scripts/eval_run.ts`, `scripts/eval_adapters.ts`, `scripts/eval_scorer.ts` sind **nicht** in `src/`, sondern in `scripts/` — fallen also aus `include` raus (`vitest.config.ts:21` = `"src/**/*.ts"`). Coverage wird nicht gemessen für die Eval-Runner. **Ist das gewollt, oder sollen `scripts/eval_*.ts` in Coverage-Include aufgenommen werden?** Spec §1.8 fordert Coverage für Adapter, nicht für Runner — Spec ist hier unklar.

3. **Tier-1 (Pre-LLM) Default-Wert-Konflikt:** Spec §1.3.3 zeigt `PIPELINE_PRE_LLM_PROVIDER.default("lfm25-local")` — aber das setzt voraus, dass der Ollama-Sidecar sofort verfügbar ist. Im ersten Boot des Workers ist der Sidecar aber noch nicht warm (Ollama-Modell-Pull dauert). **Was ist der sichere Boot-Default?** Vorschlag: `"rule-based"` für die ersten 60s, dann feature-flag-gesteuerter Switch zu `lfm25-local` nach Sidecar-Health-Check.

4. **Fixture-Format-Drift:** `pre_llm_classifier.jsonl` ist bereits im Repo (18 Fixtures), aber Spec §2.1 zeigt 18 Beispiel-Fixtures. Identische Anzahl, aber die existierenden Fixtures haben **keine** `target_embodiment` / `voice_target_traits` Felder (das ist korrekt für pre_llm, aber die Datei-Format-Doku in Spec §1.1 ist generisch — Spec §2.1 für pre_llm erwähnt die Tier-spezifischen Voice-Felder nicht). **Bitte bestätigen: sollen `pre_llm`-Fixtures leer in `target_embodiment` sein, oder sollen wir die Felder weglassen (wie aktuell)?**

5. **`scripts/eval_run.ts` Network-Calls in CI:** Eval-Spec §5.2 schlägt Nightly-CI-Run vor. Aber CI-Runner haben oft **keinen** egress auf `openrouter.ai` (z.B. self-hosted Gitea, GitHub Free-Tier hat es, aber Sandboxing unklar). **Wo läuft die CI? Hat sie Egress?** Alternative: Eval-Run auf Render-Cron (analog zu `embodiments-daily-snippets` in `render.yaml:128-145`).

6. **`LFM2.5-1.2B` Modellname-Diskrepanz:** Spec §1.3.1 zeigt `process.env.LFM25_LOCAL_MODEL || "lfm2.5:1.2b-instruct"` (Ollama-Tag-Format), aber Shortlist §0 zeigt `"liquid/lfm-2.5-1.2b-instruct:free"` (OpenRouter-Slug-Format). Zwei verschiedene Identifier für zwei verschiedene Endpoints. **Bitte bestätigen: Ist die Variante "lfm2.5-1.2b-instruct" auf Ollama verfügbar (Ollama-Hub), oder muss der Tag ein anderer sein?** Ollama-Tag-Lookup nötig.

7. **Tier-1 `llmProviderResolver`-Coupling:** Spec §1.3.4 zeigt die neuen Cases `if (provider === "lfm25-local")` etc. im `getProviderClient()`. Aber `LLMProvider`-Type in `src/clients/llmClient.ts:5` ist `"xai" | "openai" | "anthropic"` — TypeScript erlaubt das Zuweisen der neuen Strings nicht. **Soll der `LLMProvider`-Type direkt in `llmClient.ts:5` erweitert werden, oder ein separater `TieredLLMProvider`-Type in `envSchema.ts` entstehen?** Spec §1.3.3 zeigt `z.enum([...])` aber nicht den Type.

---

## 7. Definition-of-Done (gesamte Migration)

Übersetzt `migration_spec.md` §8 in messbare Kriterien + Verifikations-Kommandos.

| # | Kriterium (aus Spec §8) | Messbare Form | Verifikations-Kommando |
|---|---|---|---|
| **DoD-1** | Phase 1+2+3 deployed, 7 Tage ohne Rollback stabil | Git-Log: 3 Merge-Commits, alle 7 Tage zurück frei von `PIPELINE_*_PROVIDER=xai`-Reverts | `git log --since="7 days ago" --grep="revert" --oneline \| wc -l` = 0 + `git log --grep="PIPELINE_.*PROVIDER" --oneline` zeigt Free-Defaults |
| **DoD-2** | Eval-Suite läuft wöchentlich, Pass-Rate ≥ 90 %/85 %/75 % | JSON-Output der letzten 4 Wochen zeigt Pass-Rate ≥ Threshold | `jq '.pass_rate_per_model' eval-results/$(date +%Y-%m-%d)-*.json` + manueller Threshold-Check |
| **DoD-3** | Cost-Reduction ≥ 70 % vs. Baseline | xAI-Token-Verbrauch in Render-Dashboard ≤ 30 % der Vor-Migration-Werte | dashboard-lookup + `git log --since="30 days ago" --oneline` zeigt Free-Tier-Migration |
| **DoD-4** | Public-Guard-Trigger-Rate nicht gestiegen | `data/audit_log.jsonl` zeigt keine Zunahme von `forbidden_*`-Hits in `validation_result` | `jq '.validation_result.checks' data/audit_log.jsonl` Vergleich Woche-zu-Woche |
| **DoD-5** | Coaching-Context identische Test-Coverage | `pnpm --filter landing test` zeigt ≥63 Tests grün (Vorgabe aus spec §3.5) | `pnpm --filter landing test 2>&1 \| tail -5` |
| **DoD-6** | Runbook in `docs/operations/runbook.md` aktualisiert | Datei enthält Abschnitt "Free-Tier-Troubleshooting" | `grep -l "Free-Tier" docs/operations/runbook.md` exit 0 |
| **DoD-7** | README + `.env.example` haben neue env-vars dokumentiert | `.env.example` enthält `OPENROUTER_API_KEY`, `LFM25_LOCAL_URL`, `PIPELINE_PRE_LLM_PROVIDER`, `PIPELINE_REASONING_PROVIDER`, `PIPELINE_GENERATION_PROVIDER`, `CONSULT_GENERATION_PROVIDER` | `grep -E "OPENROUTER_API_KEY\|LFM25_LOCAL_URL\|PIPELINE_.*_PROVIDER" .env.example \| wc -l` ≥ 5 |
| **DoD-extra-1** | Coverage-Gate weiter grün (85/80) | `pnpm test:coverage` exit 0 | `pnpm test:coverage 2>&1 \| tail -3` |
| **DoD-extra-2** | Typecheck + Lint grün auf `main` | `pnpm ci` exit 0 | `pnpm ci 2>&1 \| tail -5` |
| **DoD-extra-3** | Audit-Log zeigt `model_id` aus Free-Familie für ≥ 50 % der Pipeline-Calls | `data/audit_log.jsonl` `model_id` Wert-Verteilung | `jq -r .model_id data/audit_log.jsonl \| sort \| uniq -c` |

---

## 8. Cross-Reference Plan-Index

- **§1.5 (Pre-LLM Go/No-Go)** → §4 Phase 1 → §7 DoD-1, DoD-2
- **§1.6 (Pre-LLM Rollback)** → §5 R5 Mitigation
- **§2.5 (Reasoning Go/No-Go)** → §4 Phase 2 → §7 DoD-1, DoD-2
- **§2.6 (Reasoning Rollback)** → §5 R5
- **§3.5 (Generation Go/No-Go)** → §4 Phase 3 → §7 DoD-1, DoD-2
- **§3.6 (Generation Rollback)** → §5 R5
- **§6 Risk-Register** → §5 R1–R8 (re-priorisiert)
- **§8 Erfolgs-Kriterien** → §7 DoD-1 bis DoD-7
- **openrouter_free_models_shortlist.md §0** (20 req/min) → §5 R1
- **openrouter_free_models_shortlist.md §4.4 (Coaching-Context)** → §5 R2
- **evaluation_suite_spec.md §7 (Implementation-Reihenfolge)** → §3 (First Slice), §4 (Phase 0)

---

## 9. Next Gate (eindeutig)

**Implementer kann sofort Slice A (§3) aufgreifen.** Erstes Commit sollte enthalten: `reasoning_orchestrator.jsonl` + `generation_embodiment_voice.jsonl` + `voice_judge_prompt.txt` + `scripts/eval_run.ts` + `scripts/eval_adapters.ts` + `scripts/eval_scorer.ts` + pnpm-Scripts + Vitest-Tests für Scorer-Determinismus.

**Gate-Empfehlung:** Slice-A-PR reviewen gegen §3 Akzeptanz-Kriterien. Nach Merge: realer OpenRouter-Run mit LFM2.5-Free als Baseline, **bevor** Phase-1-Adapter gebaut werden. Reihenfolge: Slice A → Slice B (Phase 1) ist daten-getrieben optimal.

# QUICKSTART

Minimal guide to run the system locally and verify it works.

> Environment variables are defined in `.env.example` and summarized in `docs/operations/var.README.md`.
> Use `.env.example` as the file to copy and fill for local runs.

---

## 1️⃣ Prerequisites

- Node.js >= 20.0.0
- pnpm
- Required API keys (see `.env.example`)

---

## 2️⃣ Install dependencies

```bash
pnpm install
```

---

## 3️⃣ Configure environment

1. Copy environment template (if available):

```bash
cp .env.example .env
```

2. Open `.env` and configure required variables.

📌 Variable documentation:
→ [`.env.example`](../../.env.example) and [`docs/operations/var.README.md`](../operations/var.README.md)

---

## 4️⃣ Start development

```bash
pnpm poll
```

Expected:

* Server starts without errors
* Logs show provider initialization
* No missing environment warnings

---

## 5️⃣ Basic verification (Smoke Test)

Verify at least one of the following:

* Health endpoint responds
* Mention polling starts successfully
* Image generation request executes (if enabled)
* Logs show provider authentication success

If something fails:

* Check missing ENV keys
* Validate API tokens
* Ensure correct start script in `package.json`

---

## 🧭 Where to go next

| Topic | File |
|-------|------|
| Variables | `.env.example` |
| Embodiment | `docs/lore/ORGANOID_EMBODIMENTS.md` |
| Architecture | `docs/architecture/` |
| Workflows | `docs/workflows/` |
| Adaptive Intelligence | `docs/implementation/PHASE2_ADAPTIVE_INTELLIGENCE.md` |
| Semantic Intelligence | `docs/implementation/PHASE3_SEMANTIC_INTELLIGENCE.md` |

---

## ⚠️ Drift Prevention Rule

* Environment variables → `.env.example` plus `docs/operations/var.README.md`
* Setup instructions → only in `docs/operations/QUICKSTART.md`
* Workflows → only in `docs/workflows/`

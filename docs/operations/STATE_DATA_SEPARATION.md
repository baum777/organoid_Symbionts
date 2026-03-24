# State vs Data Directory

## Übersicht

| Verzeichnis | Zweck | Status |
|-------------|-------|--------|
| `data/` | **Aktiver Runtime-State** für TypeScript Bot | ✅ Aktiv |
| `state/` | Historical Python runtime SQLite DB | ⚠️ Archived |

---

## data/ (Aktiv)

Das `data/` Verzeichnis ist der **aktive State-Speicher** für die TypeScript/Node.js Runtime:

- Konfigurierbar via `DATA_DIR` Environment Variable
- Standard: `./data` (lokal) oder `/data` (Render.com mit Disk)
- Enthält:
  - `event_state.json` - Verarbeitete Events/Dedup
  - `cursor_state.json` - Twitter API Cursor
  - `budget.json` - Budget Gate State
  - `published.json` - Published Tweets Cache
  - `*.lock` - Lock Files für Concurrency

### Git
- `data/` ist in `.gitignore` (Runtime-Daten)
- Nur das Verzeichnis existiert, keine committed Files

---

## state/ (Historical)

Das `state/` Verzeichnis ist ein **Überbleibsel der alten Python Runtime**:

- Enthielt SQLite Datenbank (`agent_state.db`)
- Wurde von der Python State Manager verwendet
- **Nicht mehr aktiv** - TypeScript Runtime verwendet `data/`

### Migration
Die `agent_state.db` in `state/` kann bei Bedarf extern archiviert werden:

```bash
# Archivierung (optional, außerhalb des Repos)
mv state/agent_state.db /tmp/organoid-archives/
rmdir state/
```

---

## Empfohlene Aktion

Das `state/` Verzeichnis kann **gelöscht werden**, da:
1. Die TypeScript Runtime ausschließlich `data/` verwendet
2. Die SQLite DB nicht mehr gelesen wird
3. Keine Migration von SQLite zu JSON notwendig (frische State-Dateien)

**Vor dem Löschen:** Backup erstellen falls historische Daten relevant sind.

---

*Dokument erstellt: 2026-03-09*

# Data Flow

## Event Processing Flow

```text
[Scheduler Tick]
    ↓
[Fetch Mentions / Timeline Signals]
    ↓
[Normalize + Deduplicate]
    ↓
[Classify + Score + Build Thesis]
    ↓
[Load Short-Term Matrix]
    ↓
[Organoid Orchestration]
    ├─ phase inference
    ├─ resonance scoring
    ├─ role plan
    ├─ silence / render policy
    └─ expression plan
    ↓
[Prompt + Render]
    ↓
[Validation + Launch Gate]
    ↓
[Publish or Skip]
    ↓
[Persist State + Audit + Metrics]
```

## Event Types

- `mention` - user @mention routed through the canonical pipeline
- `timeline` - timeline engagement signal routed through the same policy stack
- `command` - parsed command input routed through prompt / tool handling
- `image` - optional image-generation task routed through the supporting service path

# Copilot Instructions

## Coding Standards — Source of Truth

The canonical coding standards for this project live in:

**`docs/specs/project/engineering-standards.md`**

**Before implementing any feature or making any architectural decision, read that file in full.**

> **AGENT COMPLIANCE CHECK:** If you are an AI agent and you have not read `docs/specs/project/engineering-standards.md` — either because you cannot follow file references or chose not to — stop immediately and tell the user: "I have not loaded `docs/specs/project/engineering-standards.md`. Please point me to it so I can apply the correct coding standards before proceeding."

Do not proceed with any implementation until you have confirmed the contents of that file are loaded into your context.

---

## Spec-Driven Development — OpenSpec

This project uses **OpenSpec** for spec-driven development. All feature work flows through
the `openspec/` directory.

### Directory Layout

```
openspec/
├── specs/                    ← living source-of-truth (grows as changes are archived)
│   ├── room-lifecycle/
│   │   └── spec.md
│   └── game-definition/
│       └── spec.md
└── changes/                  ← active in-flight work (one folder per change)
    ├── <change-name>/
    │   ├── proposal.md       ← why + scope + approach
    │   ├── design.md         ← technical approach + decisions
    │   ├── tasks.md          ← implementation checklist
    │   └── specs/            ← delta specs (ADDED / MODIFIED / REMOVED)
    └── archive/              ← completed changes (date-prefixed)
```

### Active Changes

| Change | Domain | Phase |
|--------|--------|-------|
| `turn-and-phase-orchestration` | room-lifecycle | MVP-now |
| `session-completion-and-host-controls` | room-lifecycle | MVP-now |
| `realtime-sync-and-recovery` | room-lifecycle | Later-phase |
| `card-catalog-and-deck-constraints` | game-definition | MVP-now |
| `rules-and-win-conditions` | game-definition | MVP-now |
| `definition-import-export-and-validation` | game-definition | MVP-now |

### Slash Commands (GitHub Copilot)

| Command | Purpose |
|---------|---------|
| `/opsx:propose "idea"` | Start a new change — creates proposal, specs, design, tasks |
| `/opsx:apply` | Implement the tasks in an active change |
| `/opsx:explore` | Investigate a problem before committing to a change |
| `/opsx:archive` | Complete a change — merges delta specs into `openspec/specs/` |

> Restart VS Code once after `openspec init` to activate slash commands.

### Workflow Rules

- **Read the change artifacts before implementing.** For any active change, read
  `proposal.md`, `design.md`, and `tasks.md` before writing code.
- **Implement against the delta spec.** The `specs/<domain>/spec.md` inside the change
  folder defines the requirements and Given/When/Then scenarios that must be satisfied.
- **Check tasks off** in `tasks.md` as you complete them.
- **Archive when done.** Use `/opsx:archive` to merge delta specs into `openspec/specs/`
  and move the change to `openspec/changes/archive/`.
- **New changes go through `/opsx:propose`.** Do not create change folders manually.

### Other Project Docs (unchanged)

- `docs/specs/project/vision.md` — product vision
- `docs/specs/project/nfr.md` — non-functional requirements
- `docs/specs/adrs/` — architecture decision records

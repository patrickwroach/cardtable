# Design: Rules and Win Conditions

## Technical Approach

Turn phases are stored as a `turnPhases` array in the game definition, where each phase
has an ID, label, and list of transition conditions. Win conditions are stored as a
`winConditions` array, each containing a condition expression and outcome descriptor.
`validateRulesDefinition` checks for cycles with no exit and undefined state references.

## Architecture Decisions

### Decision: Linear phase model for v1
Phase sequence is a simple ordered list in v1. Graph/branching support is deferred.
This keeps validation tractable and rule authoring simple.

### Decision: Condition expressions as structured objects (not free-form strings)
Conditions are typed objects (e.g. `{ type: "scoreReached", value: 10 }`) rather than
free-form expressions. Keeps validation deterministic and prevents injection risk.

## Data Model (within game definition)

```ts
turnPhases: Array<{
  id: string
  label: string
  transitionConditions: Array<{ type: string; [key: string]: unknown }>
  nextPhaseId: string | null   // null = loop back to first
}>

winConditions: Array<{
  id: string
  condition: { type: string; [key: string]: unknown }
  outcome: string   // e.g. "player_wins", "draw"
}>
```

## APIs

| API | Purpose |
|---|---|
| `validateRulesDefinition(definition)` | Return field-level errors; empty = valid |
| `saveGameDefinition(definition)` | Persist after validation |

## File Changes

- `src/services/gameDefinitionService.ts` — validation for phases and win conditions
- `src/types/gameDefinition.ts` — extend types for `turnPhases` and `winConditions`
- `src/components/` — rules editor UI (new component)
